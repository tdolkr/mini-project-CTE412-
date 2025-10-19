import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { registerUser, authenticateUser } from '../services/authService';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload = registerSchema.parse(req.body);
    const result = await registerUser(payload);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await authenticateUser(payload.email, payload.password);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
