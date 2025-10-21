import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import {
  createHabitForUser,
  deleteHabitForUser,
  listHabitsWithEntries,
  markHabitCompletion,
  clearHabitCompletion
} from '../services/habitService';

const createHabitSchema = z.object({
  name: z.string().min(1),
  description: z.string().max(300).optional().nullable()
});

const markSchema = z.object({
  date: z.string().optional(),
  completed: z.boolean().optional()
});

export const listHabits = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const habits = await listHabitsWithEntries(user.id);
    res.status(200).json({ habits });
  } catch (error) {
    next(error);
  }
};

export const createHabit = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const payload = createHabitSchema.parse(req.body);
    const habit = await createHabitForUser(user.id, payload);
    res.status(201).json({ habit });
  } catch (error) {
    next(error);
  }
};

export const deleteHabit = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    await deleteHabitForUser(user.id, req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const markHabit = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const payload = markSchema.parse(req.body);
    const user = req.user!;
    await markHabitCompletion(req.params.id, user.id, payload);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const clearSchema = z.object({
  id: z.string(),
  date: z.string()
});

export const clearHabit = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { date, id } = clearSchema.parse(req.params);
    const user = req.user!;
    await clearHabitCompletion(id, user.id, date);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
