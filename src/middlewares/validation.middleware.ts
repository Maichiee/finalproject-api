import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

export const validateRegistration = (req: Request, res: Response, next: NextFunction): void => {
  const schema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.string().email({ message: "Invalid email format" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    phone: z.string().min(10, { message: "Phone number must be at least 10 characters" }),
    gender: z.enum(["male", "female", "other"], {
      errorMap: () => ({ message: "Gender must be male, female, or other" }),
    }),
    is_location_allowed: z.boolean().optional().default(false),
    longitude: z.string().or(z.number()).transform(Number).optional().nullable(),
    latitude: z.string().or(z.number()).transform(Number).optional().nullable(),
    birthdate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Birthdate must be a valid date",
    }),
    education: z.string(),
    address: z.string(),
  });

  const validationResult = schema.safeParse(req.body);

  if (!validationResult.success) {
    const errors = validationResult.error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));

    res.status(400).json({ errors });
    return;
  }

  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const schema = z.object({
    email: z.string().email({ message: "Invalid email format" }),
    password: z.string().min(1, { message: "Password is required" }),
  });

  const validationResult = schema.safeParse(req.body);

  if (!validationResult.success) {
    const errors = validationResult.error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));

    res.status(400).json({ errors });
    return;
  }

  next();
};