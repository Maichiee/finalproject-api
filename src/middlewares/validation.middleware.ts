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
  const { registrationToken, name, password, phone, gender, birthdate, education, address } = req.body

  if (!registrationToken) {
    res.status(400).json({ message: "Registration token is required" })
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
