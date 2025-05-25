import type { Request, Response } from "express"
import jwt from "jsonwebtoken"
import prisma from "../lib/prisma"
import { JWT_SECRET, TOKEN_EXPIRY } from "../config"

interface SocialUserData {
  id: string
  email: string
  name: string
  picture?: string
  provider: "google" | "facebook" | "twitter"
}

/**
 * Handle social login callback
 */
export const socialLoginCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userData } = req.body as { userData: SocialUserData }

    if (!userData || !userData.id || !userData.email || !userData.name || !userData.provider) {
      res.status(400).json({ message: "Invalid social login data" })
      return
    }

    const { id, email, name, picture, provider } = userData

    // Check if user already exists with this email
    let user = await prisma.user.findUnique({ where: { email } })

    if (user) {
      // User exists, check if they're using the same provider
      if (user.auth_provider !== provider) {
        res.status(400).json({
          message: `An account with this email already exists using ${user.auth_provider} authentication. Please use ${user.auth_provider} to login.`,
        })
        return
      }

      // Update user's profile picture if provided
      if (picture && picture !== user.profile_picture) {
        user = await prisma.user.update({
          where: { email },
          data: {
            profile_picture: picture,
            name: name || user.name,
          },
        })
      }
    } else {
      // Create new user with only the fields that exist in the current schema
      user = await prisma.user.create({
        data: {
          email,
          name,
          profile_picture: picture,
          auth_provider: provider,
          is_verified: true, // Social login users are automatically verified
          role: "user", // Default role, can be changed later
          verification_attempts: 0,
          reset_password_used: false,
        },
      })
    }

    // Generate JWT token
    const token = jwt.sign({ user_id: user.user_id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: TOKEN_EXPIRY,
    })

    // Return user data without sensitive information
    const { password, ...userWithoutSensitiveData } = user

    res.status(200).json({
      message: "Social login successful",
      user: userWithoutSensitiveData,
      token,
    })
  } catch (error) {
    console.error("Social login error:", error)
    res.status(500).json({ message: "Server error during social login" })
  }
}

/**
 * Link social account to existing user
 */
export const linkSocialAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userData, userId } = req.body as { userData: SocialUserData; userId: string }

    if (!userData || !userId) {
      res.status(400).json({ message: "User data and user ID are required" })
      return
    }

    const { provider } = userData

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { user_id: userId } })

    if (!user) {
      res.status(404).json({ message: "User not found" })
      return
    }

    // Update auth provider if linking first social account
    await prisma.user.update({
      where: { user_id: userId },
      data: {
        auth_provider: provider,
      },
    })

    res.status(200).json({
      message: `${provider} account linked successfully`,
    })
  } catch (error) {
    console.error("Link social account error:", error)
    res.status(500).json({ message: "Server error during social account linking" })
  }
}

/**
 * Unlink social account from user
 */
export const unlinkSocialAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { provider, userId } = req.body

    if (!provider || !userId) {
      res.status(400).json({ message: "Provider and user ID are required" })
      return
    }

    const user = await prisma.user.findUnique({ where: { user_id: userId } })

    if (!user) {
      res.status(404).json({ message: "User not found" })
      return
    }

    // Check if user has a password (can't unlink if it's their only auth method)
    if (!user.password && user.auth_provider === provider) {
      res.status(400).json({
        message: "Cannot unlink the only authentication method. Please set a password first.",
      })
      return
    }

    // Update auth provider back to email if unlinking
    await prisma.user.update({
      where: { user_id: userId },
      data: {
        auth_provider: user.password ? "email" : user.auth_provider,
      },
    })

    res.status(200).json({
      message: `${provider} account unlinked successfully`,
    })
  } catch (error) {
    console.error("Unlink social account error:", error)
    res.status(500).json({ message: "Server error during social account unlinking" })
  }
}
