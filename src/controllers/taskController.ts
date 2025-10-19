import { Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  createTaskForUser,
  listUserTasks,
  getTaskForUser,
  updateTaskForUser,
  deleteTaskForUser
} from '../services/taskService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { AppError } from '../utils/errors';

const dateTransformer = z
  .string()
  .datetime()
  .transform((value) => new Date(value));

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().max(1000).nullable().optional(),
  dueDate: dateTransformer.nullable().optional()
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().max(1000).nullable().optional(),
  dueDate: dateTransformer.nullable().optional(),
  status: z.enum(['pending', 'in_progress', 'done']).optional()
});

const ensureUser = (req: AuthenticatedRequest) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }
  return req.user;
};

export const listTasks = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = ensureUser(req);
    const tasks = await listUserTasks(user.id);
    res.status(200).json({ tasks });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = ensureUser(req);
    const payload = createTaskSchema.parse(req.body);
    const task = await createTaskForUser({
      userId: user.id,
      ...payload
    });
    res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
};

export const getTask = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = ensureUser(req);
    const task = await getTaskForUser(req.params.id, user.id);
    res.status(200).json({ task });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = ensureUser(req);
    const payload = updateTaskSchema.parse(req.body);
    const task = await updateTaskForUser({
      id: req.params.id,
      userId: user.id,
      ...payload
    });
    res.status(200).json({ task });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = ensureUser(req);
    await deleteTaskForUser(req.params.id, user.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
