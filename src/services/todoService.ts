import { createTodo, listTodosForUser, deleteTodo } from '../db/todoRepository';
import { AppError } from '../utils/errors';
import { Todo } from '../types';

export const createTodoForUser = async (userId: string, title: string): Promise<Todo> => {
  if (!title.trim()) {
    throw new AppError('Title is required', 400);
  }
  return createTodo({ userId, title: title.trim() });
};

export const listUserTodos = async (userId: string): Promise<Todo[]> => {
  return listTodosForUser(userId);
};

export const deleteTodoForUser = async (userId: string, todoId: string): Promise<void> => {
  const removed = await deleteTodo(todoId, userId);
  if (!removed) {
    throw new AppError('Todo not found', 404);
  }
};
