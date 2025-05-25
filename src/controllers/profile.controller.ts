import type { Response } from "express"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import path from "path"
import fs from "fs"
import { sendVerificationEmail } from "../utils/mailer"
import { getCoordinatesFromAddress } from "../utils/geocoder"
import prisma from "../lib/prisma"
import type { AuthRequest } from "../types/express"

/**
 * Get user profile
 */
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "User not authenticated" })
      return
    }

    const user = await prisma.user.findUnique({
      where: { user_id: req.user.user_id },
      select: {
        user_id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        is_verified: true,
        gender: true,
        longitude: true,
        latitude: true,
        birthdate: true,
        education: true,
        profile_picture: true,
        address: true,
        auth_provider: true,
        created_at: true,
        updated_at: true,
      },
    })

    if (!user) {
      res.status(404).json({ message: "User not found" })
      return
    }

    res.status(200).json({
      message: "Profile retrieved successfully",
      user,
    })
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({ message: "Server error while retrieving profile" })
  }
}

/**
 * Update user profile (excluding email and password)
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "User not authenticated" })
      return
    }

    const { name, phone, gender, birthdate, education, address, is_location_allowed } = req.body

    // Validate required fields for regular users
    const user = await prisma.user.findUnique({
      where: { user_id: req.user.user_id },
    })

    if (!user) {
      res.status(404).json({ message: "User not found" })
      return
    }

    // For regular users (not admin), validate required fields
    if (user.role !== "admin") {
      if (!name || !phone || !gender || !birthdate || !education || !address) {
        res.status(400).json({
          message: "All fields are required: name, phone, gender, birthdate, education, address",
        })
        return
      }
    }

    // Get coordinates from address if location is allowed
    let latitude: number | null = user.latitude
    let longitude: number | null = user.longitude

    if (address && is_location_allowed) {
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

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { user_id: req.user.user_id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(gender && { gender }),
        ...(birthdate && { birthdate: new Date(birthdate) }),
        ...(education && { education }),
        ...(address && { address }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
      },
      select: {
        user_id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        is_verified: true,
        gender: true,
        longitude: true,
        latitude: true,
        birthdate: true,
        education: true,
        profile_picture: true,
        address: true,
        auth_provider: true,
        updated_at: true,
      },
    })

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    })
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(500).json({ message: "Server error while updating profile" })
  }
}

/**
 * Update user password
 */
export const updatePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "User not authenticated" })
      return
    }

    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: "Current password and new password are required" })
      return
    }

    if (newPassword.length < 6) {
      res.status(400).json({ message: "New password must be at least 6 characters long" })
      return
    }

    const user = await prisma.user.findUnique({
      where: { user_id: req.user.user_id },
    })

    if (!user) {
      res.status(404).json({ message: "User not found" })
      return
    }

    // Check if user uses email authentication
    if (user.auth_provider !== "email") {
      res.status(400).json({ message: "Password update is only available for email-registered accounts" })
      return
    }

    if (!user.password) {
      res.status(400).json({ message: "This account doesn't have a password set" })
      return
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)

    if (!isCurrentPasswordValid) {
      res.status(400).json({ message: "Current password is incorrect" })
      return
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    await prisma.user.update({
      where: { user_id: req.user.user_id },
      data: {
        password: hashedNewPassword,
      },
    })

    res.status(200).json({
      message: "Password updated successfully",
    })
  } catch (error) {
    console.error("Update password error:", error)
    res.status(500).json({ message: "Server error while updating password" })
  }
}

/**
 * Upload profile picture
 */
export const uploadProfilePicture = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "User not authenticated" })
      return
    }

    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" })
      return
    }

    const file = req.file

    // Validate file type
    const allowedExtensions = [".jpg", ".jpeg", ".png"]
    const fileExtension = path.extname(file.originalname).toLowerCase()

    if (!allowedExtensions.includes(fileExtension)) {
      // Delete uploaded file if invalid
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path)
      }
      res.status(400).json({ message: "Only .jpg, .jpeg, and .png files are allowed" })
      return
    }

    // Validate file size (1MB = 1024 * 1024 bytes)
    const maxSize = 1024 * 1024 // 1MB
    if (file.size > maxSize) {
      // Delete uploaded file if too large
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path)
      }
      res.status(400).json({ message: "File size must not exceed 1MB" })
      return
    }

    // Get current user to check for existing profile picture
    const user = await prisma.user.findUnique({
      where: { user_id: req.user.user_id },
    })

    if (!user) {
      // Delete uploaded file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path)
      }
      res.status(404).json({ message: "User not found" })
      return
    }

    // Delete old profile picture if exists
    if (user.profile_picture) {
      const oldPicturePath = path.join(process.cwd(), "uploads", "profiles", user.profile_picture)
      if (fs.existsSync(oldPicturePath)) {
        fs.unlinkSync(oldPicturePath)
      }
    }

    // Generate unique filename
    const uniqueFilename = `${req.user.user_id}_${Date.now()}${fileExtension}`
    const newPath = path.join(process.cwd(), "uploads", "profiles", uniqueFilename)

    // Create directory if it doesn't exist
    const uploadDir = path.dirname(newPath)
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // Move file to final location
    fs.renameSync(file.path, newPath)

    // Update user profile picture in database
    const updatedUser = await prisma.user.update({
      where: { user_id: req.user.user_id },
      data: {
        profile_picture: uniqueFilename,
      },
      select: {
        user_id: true,
        name: true,
        email: true,
        profile_picture: true,
      },
    })

    res.status(200).json({
      message: "Profile picture uploaded successfully",
      user: updatedUser,
      profile_picture_url: `/uploads/profiles/${uniqueFilename}`,
    })
  } catch (error) {
    console.error("Upload profile picture error:", error)
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }
    res.status(500).json({ message: "Server error while uploading profile picture" })
  }
}

/**
 * Request email change
 */
export const requestEmailChange = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "User not authenticated" })
      return
    }

    const { newEmail } = req.body

    if (!newEmail) {
      res.status(400).json({ message: "New email is required" })
      return
    }

    // Validate email format
    if (!newEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      res.status(400).json({ message: "Invalid email format" })
      return
    }

    // Check if new email is different from current email
    const user = await prisma.user.findUnique({
      where: { user_id: req.user.user_id },
    })

    if (!user) {
      res.status(404).json({ message: "User not found" })
      return
    }

    if (user.email === newEmail) {
      res.status(400).json({ message: "New email must be different from current email" })
      return
    }

    // Check if new email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail },
    })

    if (existingUser) {
      res.status(400).json({ message: "Email is already taken" })
      return
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Store verification token for email change
    await prisma.verificationToken.create({
      data: {
        email: newEmail,
        token: verificationToken,
        expires_at: expiresAt,
        used: false,
      },
    })

    // Send verification email to new email address
    await sendVerificationEmail(newEmail, verificationToken)

    res.status(200).json({
      message: "Verification email sent to new email address. Please verify to complete email change.",
    })
  } catch (error) {
    console.error("Request email change error:", error)
    res.status(500).json({ message: "Server error while requesting email change" })
  }
}

/**
 * Confirm email change
 */
export const confirmEmailChange = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "User not authenticated" })
      return
    }

    const { token } = req.body

    if (!token) {
      res.status(400).json({ message: "Verification token is required" })
      return
    }

    // Find verification token
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token,
        expires_at: {
          gt: new Date(),
        },
        used: false,
      },
    })

    if (!verificationToken) {
      res.status(400).json({ message: "Invalid or expired verification token" })
      return
    }

    // Check if new email is still available
    const existingUser = await prisma.user.findUnique({
      where: { email: verificationToken.email },
    })

    if (existingUser) {
      res.status(400).json({ message: "Email is no longer available" })
      return
    }

    // Update user email and mark as verified
    const updatedUser = await prisma.user.update({
      where: { user_id: req.user.user_id },
      data: {
        email: verificationToken.email,
        is_verified: true,
      },
      select: {
        user_id: true,
        name: true,
        email: true,
        is_verified: true,
      },
    })

    // Mark token as used
    await prisma.verificationToken.update({
      where: { id: verificationToken.id },
      data: { used: true },
    })

    res.status(200).json({
      message: "Email changed successfully",
      user: updatedUser,
    })
  } catch (error) {
    console.error("Confirm email change error:", error)
    res.status(500).json({ message: "Server error while confirming email change" })
  }
}

/**
 * Resend email verification for current email
 */
export const resendEmailVerification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "User not authenticated" })
      return
    }

    const user = await prisma.user.findUnique({
      where: { user_id: req.user.user_id },
    })

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

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Store verification token
    await prisma.verificationToken.create({
      data: {
        email: user.email,
        token: verificationToken,
        expires_at: expiresAt,
        used: false,
      },
    })

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken)

    res.status(200).json({
      message: "Verification email sent. Please check your inbox.",
    })
  } catch (error) {
    console.error("Resend email verification error:", error)
    res.status(500).json({ message: "Server error while resending verification email" })
  }
}

/**
 * Delete profile picture
 */
export const deleteProfilePicture = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "User not authenticated" })
      return
    }

    const user = await prisma.user.findUnique({
      where: { user_id: req.user.user_id },
    })

    if (!user) {
      res.status(404).json({ message: "User not found" })
      return
    }

    if (!user.profile_picture) {
      res.status(400).json({ message: "No profile picture to delete" })
      return
    }

    // Delete file from filesystem
    const picturePath = path.join(process.cwd(), "uploads", "profiles", user.profile_picture)
    if (fs.existsSync(picturePath)) {
      fs.unlinkSync(picturePath)
    }

    // Update user profile picture in database
    await prisma.user.update({
      where: { user_id: req.user.user_id },
      data: {
        profile_picture: null,
      },
    })

    res.status(200).json({
      message: "Profile picture deleted successfully",
    })
  } catch (error) {
    console.error("Delete profile picture error:", error)
    res.status(500).json({ message: "Server error while deleting profile picture" })
  }
}
