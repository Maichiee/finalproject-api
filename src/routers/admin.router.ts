import express from "express";
import { updateUserRole } from "../controllers/admin.controller";
import { authenticate, authorizeAdmin } from "../middlewares/auth.middleware";

const router = express.Router();

// Pastikan middleware hanya sebagai parameter rute, bukan fungsi async yang dikembalikan
router.put("/user-role", authenticate, authorizeAdmin, updateUserRole);

export default router;
