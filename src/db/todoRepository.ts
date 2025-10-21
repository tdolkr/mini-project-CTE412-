import { getPool } from './pool';
import { Todo } from '../types';

interface CreateTodoInput {
  userId: string;
  title: string;
}

const mapRowToTodo = (row: any): Todo => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  createdAt: row.created_at
});

export const createTodo = async (input: CreateTodoInput): Promise<Todo> => {
  const pool = getPool();
  const result = await pool.query(
    `
      INSERT INTO todos (user_id, title)
      VALUES ($1, $2)
      RETURNING id, user_id, title, created_at
    `,
    [input.userId, input.title]
  );
  return mapRowToTodo(result.rows[0]);
};

export const listTodosForUser = async (userId: string): Promise<Todo[]> => {
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT id, user_id, title, created_at
      FROM todos
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
    [userId]
  );
  return result.rows.map(mapRowToTodo);
};

export const deleteTodo = async (id: string, userId: string): Promise<boolean> => {
  const pool = getPool();
  const result = await pool.query(
    `
      DELETE FROM todos
      WHERE id = $1 AND user_id = $2
    `,
    [id, userId]
  );
  return (result.rowCount ?? 0) > 0;
};
