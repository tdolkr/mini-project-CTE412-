import axios from 'axios';
import { storage } from './storage';

const client = axios.create({
  baseURL: '/',
  headers: {
    'Content-Type': 'application/json'
  }
});

client.interceptors.request.use((config) => {
  const token = storage.getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface Todo {
  id: string;
  title: string;
  createdAt: string;
}

export interface HabitEntryDTO {
  date: string;
  completed: boolean;
}

export interface HabitDTO {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  entries: HabitEntryDTO[];
}

export const api = {
  async register(payload: { email: string; password: string; name: string }) {
    const { data } = await client.post<AuthResponse>('/auth/register', payload);
    return data;
  },
  async login(payload: { email: string; password: string }) {
    const { data } = await client.post<AuthResponse>('/auth/login', payload);
    return data;
  },
  async listTodos() {
    const { data } = await client.get<{ todos: Todo[] }>('/todos');
    return data.todos;
  },
  async createTodo(payload: { title: string }) {
    const { data } = await client.post<{ todo: Todo }>('/todos', payload);
    return data.todo;
  },
  async deleteTodo(id: string) {
    await client.delete(`/todos/${id}`);
  },
  async listHabits() {
    const { data } = await client.get<{ habits: HabitDTO[] }>('/habits');
    return data.habits;
  },
  async createHabit(payload: { name: string; description?: string | null }) {
    const { data } = await client.post<{ habit: HabitDTO }>('/habits', payload);
    return data.habit;
  },
  async deleteHabit(id: string) {
    await client.delete(`/habits/${id}`);
  },
  async markHabit(habitId: string, payload: { date?: string; completed?: boolean }) {
    await client.post(`/habits/${habitId}/checkins`, payload);
  },
  async clearHabit(habitId: string, date: string) {
    await client.delete(`/habits/${habitId}/checkins/${date}`);
  }
};
