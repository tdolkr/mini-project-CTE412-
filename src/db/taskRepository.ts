import { getPool } from './pool';
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

interface DBTaskRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: Date | null;
  status: TaskStatus;
  created_at: Date;
  updated_at: Date;
}

const mapRowToTask = (row: DBTaskRow): Task => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  description: row.description,
  dueDate: row.due_date,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const createTask = async (
  input: CreateTaskInput
): Promise<Task> => {
  const pool = getPool();
  const result = await pool.query<DBTaskRow>(
    `
      INSERT INTO tasks (user_id, title, description, due_date)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [input.userId, input.title, input.description ?? null, input.dueDate ?? null]
  );
  return mapRowToTask(result.rows[0]);
};

export const listTasksForUser = async (
  userId: string
): Promise<Task[]> => {
  const pool = getPool();
  const result = await pool.query<DBTaskRow>(
    `
      SELECT * FROM tasks
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
    [userId]
  );
  return result.rows.map(mapRowToTask);
};

export const findTaskById = async (
  id: string,
  userId: string
): Promise<Task | null> => {
  const pool = getPool();
  const result = await pool.query<DBTaskRow>(
    `
      SELECT * FROM tasks
      WHERE id = $1 AND user_id = $2
    `,
    [id, userId]
  );
  if (result.rowCount === 0) {
    return null;
  }
  return mapRowToTask(result.rows[0]);
};

export const updateTask = async (
  input: UpdateTaskInput
): Promise<Task | null> => {
  const pool = getPool();
  const fields: string[] = [];
  const values: Array<string | TaskStatus | Date | null> = [];

  if (typeof input.title !== 'undefined') {
    fields.push(`title = $${fields.length + 1}`);
    values.push(input.title);
  }
  if (typeof input.description !== 'undefined') {
    fields.push(`description = $${fields.length + 1}`);
    values.push(input.description);
  }
  if (typeof input.dueDate !== 'undefined') {
    fields.push(`due_date = $${fields.length + 1}`);
    values.push(input.dueDate);
  }
  if (typeof input.status !== 'undefined') {
    fields.push(`status = $${fields.length + 1}`);
    values.push(input.status);
  }

  if (fields.length === 0) {
    const existing = await findTaskById(input.id, input.userId);
    if (!existing) {
      return null;
    }
    return existing;
  }

  values.push(input.id);
  values.push(input.userId);

  const query = `
    UPDATE tasks
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE id = $${fields.length + 1} AND user_id = $${fields.length + 2}
    RETURNING *
  `;

  const result = await pool.query<DBTaskRow>(query, values);
  if (result.rowCount === 0) {
    return null;
  }
  return mapRowToTask(result.rows[0]);
};

export const deleteTask = async (
  id: string,
  userId: string
): Promise<boolean> => {
  const pool = getPool();
  const result = await pool.query(
    `
      DELETE FROM tasks
      WHERE id = $1 AND user_id = $2
    `,
    [id, userId]
  );
  return (result.rowCount ?? 0) > 0;
};
