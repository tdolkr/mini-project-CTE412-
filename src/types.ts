export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
}

export interface Todo {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: Date;
}

export interface HabitEntry {
  id: string;
  habitId: string;
  entryDate: string | Date;
  completed: boolean;
  createdAt: Date;
}
