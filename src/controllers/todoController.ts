import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import {
  createTodoForUser,
  listUserTodos,
  deleteTodoForUser,
  updateTodoForUser
} from '../services/todoService';

const createSchema = z.object({
  title: z.string().min(1)
});

export const listTodos = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const todos = await listUserTodos(user.id);
    res.status(200).json({ todos });
  } catch (error) {
    next(error);
  }
};

export const createTodo = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const payload = createSchema.parse(req.body);
    const todo = await createTodoForUser(user.id, payload.title);
    res.status(201).json({ todo });
  } catch (error) {
    next(error);
  }
};

export const deleteTodo = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    await deleteTodoForUser(user.id, req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const updateSchema = z.object({
  title: z.string().min(1)
});

export const updateTodo = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const payload = updateSchema.parse(req.body);
    const todo = await updateTodoForUser(user.id, req.params.id, payload.title);
    res.status(200).json({ todo });
  } catch (error) {
    next(error);
  }
};
