// Environment variables configuration
export const NODE_ENV = process.env.NODE_ENV || "development"
export const PORT = process.env.PORT || 1234
export const DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://postgres:Harymetal2001@localhost:5432/job_board?schema=public"

// JWT Configuration
export const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"
export const TOKEN_EXPIRY = "24h"
export const VERIFICATION_TOKEN_EXPIRY = "1h"

// Email configuration
export const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASSWORD || "",
  },
  from: process.env.SMTP_FROM || '"Job Portal" <noreply@jobportal.com>',
}

// Frontend URL for email verification links
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000"

// Geocoder configuration
export const GEOCODER_CONFIG = {
  provider: process.env.GEOCODER_PROVIDER || "openstreetmap",
  apiKey: process.env.GEOCODER_API_KEY || "",
}
