import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      email,
      password,
      phone,
      gender,
      longitude,
      latitude,
      birthdate,
      education,
      address,
      is_location_allowed,
    } = req.body;

    // Cek apakah user sudah ada
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      res.status(400).json({ message: "User with this email already exists" });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat user baru dengan data yang valid
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        gender,
        longitude: is_location_allowed ? Number(longitude) || null : null, // Pastikan data aman
        latitude: is_location_allowed ? Number(latitude) || null : null,
        birthdate: new Date(birthdate),
        education,
        is_verified: false,
        address,
        role: "user", // Default role
      },
    });

    // Generate JWT token
    const token = jwt.sign({ user_id: newUser.user_id, email: newUser.email }, JWT_SECRET, {
      expiresIn: "24h",
    });

    // Kembalikan data user tanpa password
    const { password: _, ...userData } = newUser;
    /*
      subject: ...,
      body: <h1>Welcome Purwadhika. http://localhost:3000/verify/${token}</h1>
    */
    res.status(201).json({
      message: "User registered successfully",
      user: userData,
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Cek apakah user ada
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Kembalikan user tanpa password
    const { password: _, ...userData } = user;

    res.status(200).json({
      message: "Login successful",
      user: userData,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};