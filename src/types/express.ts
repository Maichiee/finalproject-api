import type { Request } from "express"

export interface AuthRequest extends Request {
  user?: {
    user_id: string
    email: string
    role: string
  }
}

export interface VerificationToken {
  email: string
  role: string
  exp: number
  iat: number
}
