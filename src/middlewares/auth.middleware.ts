import type { Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import prisma from "../lib/prisma"
import type { AuthRequest } from "../types/express"
import { JWT_SECRET } from "../config"

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ message: "No token provided, authorization denied" })
      return
    }

    const token = authHeader.split(" ")[1]

    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { user_id: string; email: string; role?: string }
    } catch (error) {
      res.status(401).json({ message: "Invalid token, authorization denied" })
      return
    }

    const user = await prisma.user.findUnique({
      where: { user_id: decoded.user_id },
    })

    if (!user) {
      res.status(401).json({ message: "User not found, authorization denied" })
      return
    }

    req.user = {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    }

    next()
  } catch (error) {
    console.error("Authentication error:", error)
    res.status(500).json({ message: "Server error during authentication" })
  }
}

export const authorizeAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user?.role || req.user.role !== "admin") {
    res.status(403).json({ message: "Access denied, admin privileges required" })
    return
  }

  next()
}

export const authorizeRecruiter = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user?.role || req.user.role !== "recruiter") {
    res.status(403).json({ message: "Access denied, recruiter privileges required" })
    return
  }

  next()
}

export const authorizeRecruiterOrAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user?.role || (req.user.role !== "recruiter" && req.user.role !== "admin")) {
    res.status(403).json({ message: "Access denied, recruiter or admin privileges required" })
    return
  }

  next()
}
