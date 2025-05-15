import express from "express"
import { login, register } from "../controllers/auth.controller"
import { validateLogin, validateRegistration } from "../middlewares/validation.middleware"

const router = express.Router()

router.post("/register", validateRegistration, register)
router.post("/login", validateLogin, login)

export default router
