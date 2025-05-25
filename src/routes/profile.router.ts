import express from "express"
import {
  getProfile,
  updateProfile,
  updatePassword,
  uploadProfilePicture,
  requestEmailChange,
  confirmEmailChange,
  resendEmailVerification,
  deleteProfilePicture,
} from "../controllers/profile.controller"
import { authenticate } from "../middlewares/auth.middleware"
import { uploadSingle, handleUploadError } from "../middlewares/upload.middleware"
import {
  validateProfileUpdate,
  validatePasswordUpdate,
  validateEmailChange,
  validateVerification,
} from "../middlewares/validation.middleware"

const router = express.Router()

// All profile routes require authentication
router.use(authenticate)

// Get user profile
router.get("/", getProfile)

// Update profile (excluding email and password)
router.put("/", validateProfileUpdate, updateProfile)

// Update password
router.put("/password", validatePasswordUpdate, updatePassword)

// Upload profile picture
router.post("/picture", uploadSingle, handleUploadError, uploadProfilePicture)

// Delete profile picture
router.delete("/picture", deleteProfilePicture)

// Email management
router.post("/email/change", validateEmailChange, requestEmailChange)
router.post("/email/change/confirm", validateVerification, confirmEmailChange)
router.post("/email/verify/resend", resendEmailVerification)

export default router
