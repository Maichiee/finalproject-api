import nodemailer from "nodemailer"
import { SMTP_CONFIG, FRONTEND_URL } from "../config"

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  host: SMTP_CONFIG.host,
  port: SMTP_CONFIG.port,
  secure: SMTP_CONFIG.secure,
  auth: {
    user: SMTP_CONFIG.auth.user,
    pass: SMTP_CONFIG.auth.pass,
  },
})

// Function to send verification email
export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
  const verificationUrl = `${FRONTEND_URL}/verify?token=${token}`

  const mailOptions = {
    from: SMTP_CONFIG.from,
    to: email,
    subject: "Email Verification - Job Portal",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h1 style="color: #333; text-align: center;">Verify Your Email</h1>
        <p style="font-size: 16px; line-height: 1.5; color: #555;">Thank you for registering with our Job Portal. Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
        </div>
        <p style="font-size: 14px; color: #777;">If you did not create an account, please ignore this email.</p>
        <p style="font-size: 14px; color: #777;">If the button doesn't work, you can copy and paste the following link into your browser:</p>
        <p style="font-size: 14px; word-break: break-all; color: #777;">${verificationUrl}</p>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Verification email sent to ${email}`)
  } catch (error) {
    console.error("Error sending verification email:", error)
    throw new Error("Failed to send verification email")
  }
}
