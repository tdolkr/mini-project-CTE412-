import { getPool } from './pool';
import { Habit, HabitEntry } from '../types';

type HabitRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: Date;
};

type HabitEntryRow = {
  id: string;
  habit_id: string;
  entry_date: string;
  completed: boolean;
  created_at: Date;
};

interface CreateHabitInput {
  userId: string;
  name: string;
  description?: string | null;
}

interface UpsertHabitEntryInput {
  habitId: string;
  entryDate: string;
  completed?: boolean;
}

const mapHabitRow = (row: HabitRow): Habit => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  description: row.description,
  createdAt: row.created_at
});

const mapHabitEntryRow = (row: HabitEntryRow): HabitEntry => ({
  id: row.id,
  habitId: row.habit_id,
  entryDate: row.entry_date,
  completed: row.completed,
  createdAt: row.created_at
});

export const createHabit = async (input: CreateHabitInput): Promise<Habit> => {
  const pool = getPool();
  const result = await pool.query(
    `
      INSERT INTO habits (user_id, name, description)
      VALUES ($1, $2, $3)
      RETURNING id, user_id, name, description, created_at
    `,
    [input.userId, input.name, input.description ?? null]
  );
  return mapHabitRow(result.rows[0]);
};

export const listHabitsForUser = async (userId: string): Promise<Habit[]> => {
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT id, user_id, name, description, created_at
      FROM habits
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
    [userId]
  );
  return result.rows.map(mapHabitRow);
};

export const findHabitById = async (id: string): Promise<Habit | null> => {
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT id, user_id, name, description, created_at
      FROM habits
      WHERE id = $1
    `,
    [id]
  );
  if (result.rowCount === 0) {
    return null;
  }
  return mapHabitRow(result.rows[0]);
};

export const deleteHabit = async (id: string, userId: string): Promise<boolean> => {
  const pool = getPool();
  const result = await pool.query(
    `
      DELETE FROM habits
      WHERE id = $1 AND user_id = $2
    `,
    [id, userId]
  );
  return (result.rowCount ?? 0) > 0;
};

export const upsertHabitEntry = async (input: UpsertHabitEntryInput): Promise<HabitEntry> => {
  const pool = getPool();
  const result = await pool.query(
    `
      INSERT INTO habit_entries (habit_id, entry_date, completed)
      VALUES ($1, $2::date, $3)
      ON CONFLICT (habit_id, entry_date)
      DO UPDATE SET completed = EXCLUDED.completed, created_at = NOW()
      RETURNING id, habit_id, entry_date, completed, created_at
    `,
    [input.habitId, input.entryDate, input.completed ?? true]
  );
  return mapHabitEntryRow(result.rows[0]);
};

export const removeHabitEntry = async (habitId: string, entryDateISO: string): Promise<boolean> => {
  const pool = getPool();
  const result = await pool.query(
    `
      DELETE FROM habit_entries
      WHERE habit_id = $1 AND entry_date = $2::date
    `,
    [habitId, entryDateISO]
  );
  return (result.rowCount ?? 0) > 0;
};

export const removeHabitEntryByCreatedDate = async (
  habitId: string,
  createdDateISO: string
): Promise<boolean> => {
  const pool = getPool();
  const result = await pool.query(
    `
      DELETE FROM habit_entries
      WHERE habit_id = $1 AND created_at::date = $2::date
    `,
    [habitId, createdDateISO]
  );
  return (result.rowCount ?? 0) > 0;
};

export const listHabitEntriesForRange = async (
  habitId: string,
  startDateISO: string,
  endDateISO: string
): Promise<HabitEntry[]> => {
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT id, habit_id, entry_date, completed, created_at
      FROM habit_entries
      WHERE habit_id = $1 AND entry_date BETWEEN $2::date AND $3::date
      ORDER BY entry_date DESC
    `,
    [habitId, startDateISO, endDateISO]
  );
  return result.rows.map(mapHabitEntryRow);
};

export const updateHabit = async (
  habitId: string,
  userId: string,
  input: { name?: string; description?: string | null }
): Promise<Habit | null> => {
  const fields: string[] = [];
  const values: (string | null)[] = [];

  if (typeof input.name !== 'undefined') {
    fields.push('name = $' + (fields.length + 1));
    values.push(input.name);
  }
  if (typeof input.description !== 'undefined') {
    fields.push('description = $' + (fields.length + 1));
    values.push(input.description ?? null);
  }

  if (fields.length === 0) {
    const habit = await findHabitById(habitId);
    if (!habit || habit.userId !== userId) {
      return null;
    }
    return habit;
  }

  const pool = getPool();
  values.push(habitId, userId);

  const result = await pool.query(
    `
      UPDATE habits
      SET ${fields.join(', ')}
      WHERE id = $${fields.length + 1} AND user_id = $${fields.length + 2}
      RETURNING id, user_id, name, description, created_at
    `,
    values
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapHabitRow(result.rows[0]);
};
