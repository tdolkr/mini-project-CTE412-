import {
  createHabit,
  listHabitsForUser,
  deleteHabit,
  upsertHabitEntry,
  removeHabitEntry,
  removeHabitEntryByCreatedDate,
  listHabitEntriesForRange,
  findHabitById,
  updateHabit
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
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

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

export const updateHabitForUser = async (
  userId: string,
  habitId: string,
  input: { name?: string; description?: string | null }
) => {
  await ensureHabitBelongsToUser(habitId, userId);
  if (typeof input.name !== 'undefined' && !input.name.trim()) {
    throw new AppError('Name is required', 400);
  }

  const updated = await updateHabit(habitId, userId, {
    name: typeof input.name === 'string' ? input.name.trim() : undefined,
    description: typeof input.description === 'string' ? input.description : input.description
  });

  if (!updated) {
    throw new AppError('Habit not found', 404);
  }

  return updated;
};

const startOfDay = (date: Date): Date => {
  const cloned = new Date(date);
  cloned.setHours(0, 0, 0, 0);
  return cloned;
};

const endOfDay = (date: Date): Date => {
  const cloned = new Date(date);
  cloned.setHours(23, 59, 59, 999);
  return cloned;
};

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseISODate = (value: string): Date => {
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== (month ?? 1) - 1 ||
    parsed.getDate() !== day
  ) {
    throw new AppError('Invalid date provided', 400);
  }
  return parsed;
};

const ensureISODate = (value: string): string => {
  if (!ISO_DATE_REGEX.test(value)) {
    throw new AppError('Invalid date provided', 400);
  }
  parseISODate(value);
  return value;
};

const todayISO = (): string => formatLocalDate(new Date());

export const listHabitsWithEntries = async (
  userId: string,
  options: { startDate?: string; endDate?: string; days?: number } = {}
): Promise<HabitWithEntries[]> => {
  const habits = await listHabitsForUser(userId);
  let startDate: Date;
  let endDate: Date;

  if (options.startDate || options.endDate) {
    if (!options.startDate || !options.endDate) {
      throw new AppError('Both start and end dates are required', 400);
    }
    const normalizedStart = ensureISODate(options.startDate);
    const normalizedEnd = ensureISODate(options.endDate);
    const parsedStart = parseISODate(normalizedStart);
    const parsedEnd = parseISODate(normalizedEnd);
    if (parsedStart > parsedEnd) {
      throw new AppError('Start date must be before end date', 400);
    }
    startDate = startOfDay(parsedStart);
    endDate = endOfDay(parsedEnd);
  } else {
    const rangeDays = options.days ?? DEFAULT_RANGE_DAYS;
    if (rangeDays <= 0) {
      throw new AppError('Range days must be positive', 400);
    }
    endDate = endOfDay(new Date());
    startDate = startOfDay(new Date(endDate));
    startDate.setDate(startDate.getDate() - rangeDays + 1);
  }

  const startISO = formatLocalDate(startDate);
  const endISO = formatLocalDate(endDate);

  const results = await Promise.all(
    habits.map(async (habit) => {
      const entries = await listHabitEntriesForRange(
        habit.id,
        startISO,
        endISO
      );
      const mapped = entries.map((entry) => {
        const rawDate = entry.entryDate;
        const iso =
          rawDate instanceof Date ? rawDate.toISOString().slice(0, 10) : String(rawDate);
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
  const entryDate = options.date ? ensureISODate(options.date) : todayISO();
  await upsertHabitEntry({
    habitId,
    entryDate,
    completed: options.completed ?? true
  });
};

export const clearHabitCompletion = async (habitId: string, userId: string, date: string) => {
  await ensureHabitBelongsToUser(habitId, userId);
  const normalized = ensureISODate(date);
  const removed = await removeHabitEntry(habitId, normalized);
  if (removed) {
    return;
  }
  await removeHabitEntryByCreatedDate(habitId, normalized);
};
