import type { Request } from "express"

export interface AuthUser {
  user_id: string
  email: string
  role: string
}

export interface AuthRequest extends Request {
    user?: {
      user_id: string;
      email: string;
      role?: string;
    };
  }
  
