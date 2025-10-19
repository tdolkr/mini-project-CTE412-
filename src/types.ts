export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
}

export type TaskStatus = 'pending' | 'in_progress' | 'done';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}
