import express from "express"
import { initiateRegistration, verifyEmail, completeRegistration, login } from "../controllers/auth.controller"
import {
  validateInitialRegistration,
  validateVerification,
  validateCompleteRegistration,
  validateLogin,
} from "../middlewares/validation.middleware"

const router = express.Router()

// Initial registration route - collects email and role
router.post("/register/initiate", validateInitialRegistration, initiateRegistration)

// Email verification route
router.post("/verify", validateVerification, verifyEmail)

// Complete registration route - collects all user details
router.post("/register/complete", validateCompleteRegistration, completeRegistration)

// Login route
router.post("/login", validateLogin, login)

export default router
