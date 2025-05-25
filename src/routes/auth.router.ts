import express from "express"
import {
  initiateRegistration,
  verifyEmail,
  completeRegistration,
  login,
  resendVerificationEmail,
  requestPasswordReset,
  confirmPasswordReset,
} from "../controllers/auth.controller"
import { socialLoginCallback, linkSocialAccount, unlinkSocialAccount } from "../controllers/social-auth.controller"
import {
  validateInitialRegistration,
  validateVerification,
  validateCompleteRegistration,
  validateLogin,
  validatePasswordReset,
  validatePasswordResetConfirm,
  validateSocialLogin,
} from "../middlewares/validation.middleware"
import { authenticate } from "../middlewares/auth.middleware"

const router = express.Router()

// Email-based authentication routes
router.post("/register/initiate", validateInitialRegistration, initiateRegistration)
router.post("/verify", validateVerification, verifyEmail)
router.post("/verify/resend", resendVerificationEmail)
router.post("/register/complete", validateCompleteRegistration, completeRegistration)
router.post("/login", validateLogin, login)

// Password reset routes
router.post("/password/reset", validatePasswordReset, requestPasswordReset)
router.post("/password/reset/confirm", validatePasswordResetConfirm, confirmPasswordReset)

// Social authentication routes
router.post("/social/callback", validateSocialLogin, socialLoginCallback)
router.post("/social/link", authenticate, linkSocialAccount)
router.post("/social/unlink", authenticate, unlinkSocialAccount)

export default router
