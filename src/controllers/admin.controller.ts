import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user_id, new_role } = req.body;

    if (!user_id || !new_role) {
      res.status(400).json({ message: "User ID dan role baru wajib diisi" });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { user_id },
      data: { role: new_role },
    });

    res.status(200).json({ message: "Role user berhasil diperbarui", user: updatedUser });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ message: "Terjadi kesalahan di server" });
  }
};