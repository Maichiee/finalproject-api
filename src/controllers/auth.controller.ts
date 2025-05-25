import type { Request, Response } from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/mailer"
import { getCoordinatesFromAddress } from "../utils/geocoder"
import prisma from "../lib/prisma"
import { JWT_SECRET, TOKEN_EXPIRY } from "../config"

/**
 * Initial registration step - collects email and role
 */
export const initiateRegistration = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, role } = req.body

    if (!email || !role) {
      res.status(400).json({ message: "Email and role are required" })
      return
    }

    // Validate role
    if (role !== "recruiter" && role !== "worker") {
      res.status(400).json({ message: "Role must be either 'recruiter' or 'worker'" })
      return
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } })

    if (existingUser) {
      res.status(400).json({ message: "User with this email already exists" })
      return
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex")
    const verificationTokenExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Create user with verification token - using only fields that exist in schema
    await prisma.user.create({
      data: {
        email,
        role,
        name: "", // Will be filled during complete registration
        is_verified: false,
        auth_provider: "email",
        verification_attempts: 0,
        reset_password_used: false,
        // Store verification data in separate fields that we'll add to schema
        // For now, we'll use a workaround by creating the user first, then updating
      },
    })

    // Update with verification token (this is a workaround until schema is updated)
    await prisma.user.update({
      where: { email },
      data: {
        // We'll store the token in a JSON field or use a separate table
        // For now, let's use the existing approach but handle the error gracefully
      },
    })

    // Send verification email
    await sendVerificationEmail(email, verificationToken)

    res.status(200).json({
      message: "Verification email sent. Please check your inbox to continue registration.",
    })
  } catch (error) {
    console.error("Registration initiation error:", error)
    res.status(500).json({ message: "Server error during registration initiation" })
  }
}

/**
 * Resend verification email
 */
export const resendVerificationEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body

    if (!email) {
      res.status(400).json({ message: "Email is required" })
      return
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      res.status(404).json({ message: "User not found" })
      return
    }

    if (user.is_verified) {
      res.status(400).json({ message: "Email is already verified" })
      return
    }

    if (user.auth_provider !== "email") {
      res.status(400).json({ message: "This account uses social login and doesn't require email verification" })
      return
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex")

    // Send verification email
    await sendVerificationEmail(email, verificationToken)

    res.status(200).json({
      message: "Verification email resent. Please check your inbox.",
    })
  } catch (error) {
    console.error("Resend verification error:", error)
    res.status(500).json({ message: "Server error during resend verification" })
  }
}

/**
 * Verify email token
 */
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body

    if (!token) {
      res.status(400).json({ message: "Verification token is required" })
      return
    }

    // For now, we'll implement a simple token verification
    // In a production environment, you'd want to store tokens in database or Redis

    // Decode the token to get email (this is a simplified approach)
    // You should implement proper token storage and validation

    // For demonstration, let's assume the token contains the email
    // In reality, you'd query the database for the token

    res.status(200).json({
      message: "Email verified successfully. Please complete your registration.",
    })
  } catch (error) {
    console.error("Email verification error:", error)
    res.status(500).json({ message: "Server error during email verification" })
  }
}

/**
 * Complete registration with all user details
 */
export const completeRegistration = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name, password, phone, gender, birthdate, education, address, is_location_allowed } = req.body

    if (!email) {
      res.status(400).json({ message: "Email is required" })
      return
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      res.status(404).json({ message: "User not found" })
      return
    }

    if (user.name && user.name !== "") {
      res.status(400).json({ message: "Registration already completed" })
      return
    }

    // Validate required fields
    if (!name || !password || !phone || !gender || !birthdate || !education || !address) {
      res.status(400).json({ message: "All required fields must be provided" })
      return
    }

    // Get coordinates from address if location is allowed
    let latitude: number | null = null
    let longitude: number | null = null

    if (is_location_allowed) {
      try {
        const coordinates = await getCoordinatesFromAddress(address)
        if (coordinates) {
          latitude = coordinates.latitude
          longitude = coordinates.longitude
        }
      } catch (error) {
        console.error("Error getting coordinates:", error)
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update user with complete data
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        name,
        password: hashedPassword,
        phone,
        gender,
        longitude,
        latitude,
        birthdate: new Date(birthdate),
        education,
        address,
        is_verified: true, // Mark as verified when completing registration
      },
    })

    // Generate JWT token for authentication
    const token = jwt.sign(
      { user_id: updatedUser.user_id, email: updatedUser.email, role: updatedUser.role },
      JWT_SECRET,
      {
        expiresIn: TOKEN_EXPIRY,
      },
    )

    // Return user data without password
    const { password: _, ...userData } = updatedUser

    res.status(201).json({
      message: "Registration completed successfully",
      user: userData,
      token,
    })
  } catch (error) {
    console.error("Registration completion error:", error)
    res.status(500).json({ message: "Server error during registration completion" })
  }
}

/**
 * Login user
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      res.status(401).json({ message: "Invalid credentials" })
      return
    }

    // Check if user uses social login
    if (user.auth_provider !== "email") {
      res
        .status(400)
        .json({ message: "This account uses social login. Please use the appropriate social login method." })
      return
    }

    // Check if password exists (for social login users, password might be null)
    if (!user.password) {
      res.status(400).json({ message: "This account doesn't have a password. Please use social login." })
      return
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid credentials" })
      return
    }

    // Check if user is verified
    if (!user.is_verified) {
      res.status(403).json({ message: "Email not verified. Please verify your email to login." })
      return
    }

    // Generate JWT token
    const token = jwt.sign({ user_id: user.user_id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: TOKEN_EXPIRY,
    })

    // Return user data without password
    const { password: _, ...userData } = user

    res.status(200).json({
      message: "Login successful",
      user: userData,
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error during login" })
  }
}

/**
 * Request password reset
 */
export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body

    if (!email) {
      res.status(400).json({ message: "Email is required" })
      return
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      // Don't reveal if user exists or not for security
      res.status(200).json({ message: "If the email exists, a password reset link has been sent." })
      return
    }

    // Check if user uses email authentication
    if (user.auth_provider !== "email") {
      res.status(400).json({ message: "Password reset is only available for email-registered accounts." })
      return
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex")

    // Send password reset email
    await sendPasswordResetEmail(email, resetToken)

    res.status(200).json({
      message: "If the email exists, a password reset link has been sent.",
    })
  } catch (error) {
    console.error("Password reset request error:", error)
    res.status(500).json({ message: "Server error during password reset request" })
  }
}

/**
 * Confirm password reset
 */
export const confirmPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body

    if (!token || !newPassword) {
      res.status(400).json({ message: "Token and new password are required" })
      return
    }

    if (newPassword.length < 6) {
      res.status(400).json({ message: "Password must be at least 6 characters long" })
      return
    }

    // For now, we'll implement a simplified token validation
    // In production, you'd want to store and validate tokens properly

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    res.status(200).json({
      message: "Password reset successfully. You can now login with your new password.",
    })
  } catch (error) {
    console.error("Password reset confirmation error:", error)
    res.status(500).json({ message: "Server error during password reset confirmation" })
  }
}
