import type { Request, Response, NextFunction } from "express"

export const validateInitialRegistration = (req: Request, res: Response, next: NextFunction): void => {
  const { email, role } = req.body

  // Validate email
  if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    res.status(400).json({ message: "Valid email is required" })
    return
  }

  // Validate role
  if (!role || (role !== "recruiter" && role !== "worker")) {
    res.status(400).json({ message: "Role must be either 'recruiter' or 'worker'" })
    return
  }

  next()
}

export const validateVerification = (req: Request, res: Response, next: NextFunction): void => {
  const { token } = req.body

  if (!token) {
    res.status(400).json({ message: "Verification token is required" })
    return
  }

  next()
}

export const validateCompleteRegistration = (req: Request, res: Response, next: NextFunction): void => {
  const { email, name, password, phone, gender, birthdate, education, address } = req.body

  if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    res.status(400).json({ message: "Valid email is required" })
    return
  }

  if (!name || name.length < 2) {
    res.status(400).json({ message: "Name must be at least 2 characters long" })
    return
  }

  if (!password || password.length < 6) {
    res.status(400).json({ message: "Password must be at least 6 characters long" })
    return
  }

  if (!phone || !phone.match(/^\+?[0-9]{10,15}$/)) {
    res.status(400).json({ message: "Valid phone number is required" })
    return
  }

  if (!gender || (gender !== "male" && gender !== "female" && gender !== "other")) {
    res.status(400).json({ message: "Gender must be specified" })
    return
  }

  if (!birthdate || isNaN(Date.parse(birthdate))) {
    res.status(400).json({ message: "Valid birthdate is required" })
    return
  }

  if (!education) {
    res.status(400).json({ message: "Education information is required" })
    return
  }

  if (!address) {
    res.status(400).json({ message: "Address is required" })
    return
  }

  next()
}

export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password } = req.body

  if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    res.status(400).json({ message: "Valid email is required" })
    return
  }

  if (!password) {
    res.status(400).json({ message: "Password is required" })
    return
  }

  next()
}

export const validatePasswordReset = (req: Request, res: Response, next: NextFunction): void => {
  const { email } = req.body

  if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    res.status(400).json({ message: "Valid email is required" })
    return
  }

  next()
}

export const validatePasswordResetConfirm = (req: Request, res: Response, next: NextFunction): void => {
  const { token, newPassword } = req.body

  if (!token) {
    res.status(400).json({ message: "Reset token is required" })
    return
  }

  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ message: "New password must be at least 6 characters long" })
    return
  }

  next()
}

export const validateSocialLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { userData } = req.body

  if (!userData) {
    res.status(400).json({ message: "User data is required" })
    return
  }

  const { id, email, name, provider } = userData

  if (!id || !email || !name || !provider) {
    res.status(400).json({ message: "ID, email, name, and provider are required" })
    return
  }

  if (!["google", "facebook", "twitter"].includes(provider)) {
    res.status(400).json({ message: "Provider must be google, facebook, or twitter" })
    return
  }

  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    res.status(400).json({ message: "Valid email is required" })
    return
  }

  next()
}

// Profile validation middlewares
export const validateProfileUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const { name, phone, gender, birthdate, education } = req.body

  if (name && name.length < 2) {
    res.status(400).json({ message: "Name must be at least 2 characters long" })
    return
  }

  if (phone && !phone.match(/^\+?[0-9]{10,15}$/)) {
    res.status(400).json({ message: "Valid phone number is required" })
    return
  }

  if (gender && !["male", "female", "other"].includes(gender)) {
    res.status(400).json({ message: "Gender must be male, female, or other" })
    return
  }

  if (birthdate && isNaN(Date.parse(birthdate))) {
    res.status(400).json({ message: "Valid birthdate is required" })
    return
  }

  next()
}

export const validatePasswordUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const { currentPassword, newPassword } = req.body

  if (!currentPassword) {
    res.status(400).json({ message: "Current password is required" })
    return
  }

  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ message: "New password must be at least 6 characters long" })
    return
  }

  next()
}

export const validateEmailChange = (req: Request, res: Response, next: NextFunction): void => {
  const { newEmail } = req.body

  if (!newEmail || !newEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    res.status(400).json({ message: "Valid new email is required" })
    return
  }

  next()
}

// Applicant management validation middlewares
export const validateApplicationStatusUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const { status } = req.body

  if (!status) {
    res.status(400).json({ message: "Status is required" })
    return
  }

  const validStatuses = ["pending", "reviewed", "interview", "accepted", "rejected"]
  if (!validStatuses.includes(status)) {
    res.status(400).json({
      message: "Invalid status. Valid statuses are: pending, reviewed, interview, accepted, rejected",
    })
    return
  }

  next()
}

export const validateBulkStatusUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const { applicationIds, status } = req.body

  if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
    res.status(400).json({ message: "Application IDs array is required" })
    return
  }

  if (!status) {
    res.status(400).json({ message: "Status is required" })
    return
  }

  const validStatuses = ["pending", "reviewed", "interview", "accepted", "rejected"]
  if (!validStatuses.includes(status)) {
    res.status(400).json({
      message: "Invalid status. Valid statuses are: pending, reviewed, interview, accepted, rejected",
    })
    return
  }

  next()
}
