import type { Response } from "express"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import type { AuthRequest } from "../types/express"

const prisma = new PrismaClient()

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      include: {
        companies: true,
        subscriptions: {
          include: {
            subscriptioncategory: true,
          },
        },
        applications: {
          include: {
            job: {
              include: {
                company: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const { password, ...userData } = user

    res.status(200).json({
      message: "Profile retrieved successfully",
      user: userData,
    })
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({ message: "Server error while retrieving profile" })
  }
}

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const { name, phone, gender, longitude, latitude, birthdate, education, address, profile_picture } = req.body

    const updatedUser = await prisma.user.update({
      where: { user_id: userId },
      data: {
        name,
        phone,
        gender,
        longitude: longitude ? Number.parseFloat(longitude) : undefined,
        latitude: latitude ? Number.parseFloat(latitude) : undefined,
        birthdate: birthdate ? new Date(birthdate) : undefined,
        education,
        address,
        profile_picture,
        updated_at: new Date(),
      },
    })

    const { password, ...userData } = updatedUser

    res.status(200).json({
      message: "Profile updated successfully",
      user: userData,
    })
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(500).json({ message: "Server error while updating profile" })
  }
}

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const { currentPassword, newPassword } = req.body

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
    })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" })
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    // Update password
    await prisma.user.update({
      where: { user_id: userId },
      data: {
        password: hashedPassword,
        updated_at: new Date(),
      },
    })

    res.status(200).json({ message: "Password changed successfully" })
  } catch (error) {
    console.error("Change password error:", error)
    res.status(500).json({ message: "Server error while changing password" })
  }
}
