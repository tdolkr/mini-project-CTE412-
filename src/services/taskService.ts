import {
  createTask,
  listTasksForUser,
  findTaskById,
  updateTask as updateTaskRepo,
  deleteTask as deleteTaskRepo
} from '../db/taskRepository';
import { AppError } from '../utils/errors';
import { Task, TaskStatus } from '../types';

interface CreateTaskInput {
  userId: string;
  title: string;
  description?: string | null;
  dueDate?: Date | null;
}

interface UpdateTaskInput {
  id: string;
  userId: string;
  title?: string;
  description?: string | null;
  dueDate?: Date | null;
  status?: TaskStatus;
}

export const createTaskForUser = async (
  input: CreateTaskInput
): Promise<Task> => {
  return createTask({
    userId: input.userId,
    title: input.title,
    description: input.description ?? null,
    dueDate: input.dueDate ?? null
  });
};

export const listUserTasks = async (
  userId: string
): Promise<Task[]> => {
  return listTasksForUser(userId);
};

export const getTaskForUser = async (
  id: string,
  userId: string
): Promise<Task> => {
  const task = await findTaskById(id, userId);
  if (!task) {
    throw new AppError('Task not found', 404);
  }
  return task;
};

export const updateTaskForUser = async (
  input: UpdateTaskInput
): Promise<Task> => {
  const updated = await updateTaskRepo(input);
  if (!updated) {
    throw new AppError('Task not found', 404);
  }
  return updated;
};

export const deleteTaskForUser = async (
  id: string,
  userId: string
): Promise<void> => {
  const deleted = await deleteTaskRepo(id, userId);
  if (!deleted) {
    throw new AppError('Task not found', 404);
  }
};
