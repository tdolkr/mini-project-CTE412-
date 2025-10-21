import {
  createHabit,
  listHabitsForUser,
  deleteHabit,
  upsertHabitEntry,
  removeHabitEntry,
  listHabitEntriesForRange,
  findHabitById
} from '../db/habitRepository';
import { AppError } from '../utils/errors';
import { Habit } from '../types';

export interface HabitWithEntries extends Habit {
  entries: Array<{
    date: string;
    completed: boolean;
  }>;
}

const DEFAULT_RANGE_DAYS = 14;

export const createHabitForUser = async (
  userId: string,
  input: { name: string; description?: string | null }
): Promise<Habit> => {
  if (!input.name.trim()) {
    throw new AppError('Name is required', 400);
  }
  return createHabit({ userId, name: input.name.trim(), description: input.description ?? null });
};

const ensureHabitBelongsToUser = async (habitId: string, userId: string) => {
  const habit = await findHabitById(habitId);
  if (!habit || habit.userId !== userId) {
    throw new AppError('Habit not found', 404);
  }
  return habit;
};

export const deleteHabitForUser = async (userId: string, habitId: string): Promise<void> => {
  await ensureHabitBelongsToUser(habitId, userId);
  const removed = await deleteHabit(habitId, userId);
  if (!removed) {
    throw new AppError('Habit not found', 404);
  }
};

export const listHabitsWithEntries = async (
  userId: string,
  days: number = DEFAULT_RANGE_DAYS
): Promise<HabitWithEntries[]> => {
  const habits = await listHabitsForUser(userId);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days + 1);
  const endDate = new Date();

  const results = await Promise.all(
    habits.map(async (habit) => {
      const entries = await listHabitEntriesForRange(habit.id, startDate, endDate);
      const mapped = entries.map((entry) => {
        const rawDate = entry.entryDate;
        const iso = rawDate instanceof Date ? rawDate.toISOString().slice(0, 10) : String(rawDate);
        return {
          date: iso,
          completed: entry.completed
        };
      });
      return { ...habit, entries: mapped };
    })
  );
  return results;
};

export const markHabitCompletion = async (
  habitId: string,
  userId: string,
  options: { date?: string; completed?: boolean }
) => {
  await ensureHabitBelongsToUser(habitId, userId);
  const entryDate = options.date ? new Date(options.date) : new Date();
  if (Number.isNaN(entryDate.getTime())) {
    throw new AppError('Invalid date provided', 400);
  }
  await upsertHabitEntry({
    habitId,
    entryDate,
    completed: options.completed ?? true
  });
};

export const clearHabitCompletion = async (habitId: string, userId: string, date: string) => {
  await ensureHabitBelongsToUser(habitId, userId);
  const entryDate = new Date(date);
  if (Number.isNaN(entryDate.getTime())) {
    throw new AppError('Invalid date provided', 400);
  }
  const removed = await removeHabitEntry(habitId, entryDate);
  if (!removed) {
    throw new AppError('Habit check-in not found', 404);
  }
};
