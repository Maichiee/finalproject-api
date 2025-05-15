import type { Request, Response } from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { sendVerificationEmail } from "../utils/mailer"
import { getCoordinatesFromAddress } from "../utils/geocoder"
import type { VerificationToken } from "../types/express"
import prisma from "../lib/prisma"
import { JWT_SECRET, TOKEN_EXPIRY, VERIFICATION_TOKEN_EXPIRY } from "../config"

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

    // Generate verification token with email and role
    const verificationToken = jwt.sign({ email, role }, JWT_SECRET, { expiresIn: VERIFICATION_TOKEN_EXPIRY })

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
 * Verify email token
 */
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body

    if (!token) {
      res.status(400).json({ message: "Verification token is required" })
      return
    }

    let decoded: VerificationToken

    try {
      decoded = jwt.verify(token, JWT_SECRET) as VerificationToken
    } catch (error) {
      res.status(400).json({ message: "Invalid or expired verification token" })
      return
    }

    // Check if user already exists (might have registered in another tab)
    const existingUser = await prisma.user.findUnique({
      where: { email: decoded.email },
    })

    if (existingUser) {
      res.status(400).json({ message: "User with this email already exists" })
      return
    }

    // Return the decoded information for the complete registration form
    res.status(200).json({
      message: "Email verified successfully",
      email: decoded.email,
      role: decoded.role,
      // Return a new token that will be used for the complete registration
      registrationToken: token,
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
    const { registrationToken, name, password, phone, gender, birthdate, education, address, is_location_allowed } =
      req.body

    if (!registrationToken) {
      res.status(400).json({ message: "Registration token is required" })
      return
    }

    let decoded: VerificationToken

    try {
      decoded = jwt.verify(registrationToken, JWT_SECRET) as VerificationToken
    } catch (error) {
      res.status(400).json({ message: "Invalid or expired registration token" })
      return
    }

    const { email, role } = decoded

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } })

    if (existingUser) {
      res.status(400).json({ message: "User with this email already exists" })
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
        // Continue with registration even if geocoding fails
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user with all data
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        gender,
        longitude,
        latitude,
        birthdate: new Date(birthdate),
        education,
        is_verified: true, // User is verified since they completed the email verification
        address,
        role, // Use the role from the verification token
      },
    })

    // Generate JWT token for authentication
    const token = jwt.sign({ user_id: newUser.user_id, email: newUser.email, role: newUser.role }, JWT_SECRET, {
      expiresIn: TOKEN_EXPIRY,
    })

    // Return user data without password
    const { password: _, ...userData } = newUser

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
