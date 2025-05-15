import type { Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"
import type { AuthRequest } from "../types/express"

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ message: "No token provided, authorization denied" });
      return;
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { user_id: string; email: string; role?: string };
    } catch (error) {
      res.status(401).json({ message: "Invalid token, authorization denied" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { user_id: decoded.user_id },
    });

    if (!user) {
      res.status(401).json({ message: "User not found, authorization denied" });
      return;
    }

    req.user = {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    };

    next(); // Hanya next(), tidak mengembalikan response!
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ message: "Server error during authentication" });
  }
};

export const authorizeAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.role || req.user.role !== "admin") {
    res.status(403).json({ message: "Access denied, admin privileges required" });
    return;
  }

  next();
};