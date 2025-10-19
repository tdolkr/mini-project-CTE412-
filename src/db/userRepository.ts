import { getPool } from './pool';
import { User } from '../types';

interface CreateUserInput {
  email: string;
  passwordHash: string;
  name: string;
}

interface DBUserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: Date;
}

const mapRowToUser = (row: DBUserRow): User => ({
  id: row.id,
  email: row.email,
  name: row.name,
  passwordHash: row.password_hash,
  createdAt: row.created_at
});

export const createUser = async (
  input: CreateUserInput
): Promise<User> => {
  const pool = getPool();
  const query = `
    INSERT INTO users (email, password_hash, name)
    VALUES ($1, $2, $3)
    RETURNING id, email, name, password_hash, created_at
  `;
  const values = [input.email, input.passwordHash, input.name];
  const result = await pool.query<DBUserRow>(query, values);
  return mapRowToUser(result.rows[0]);
};

export const findUserByEmail = async (
  email: string
): Promise<User | null> => {
  const pool = getPool();
  const result = await pool.query<DBUserRow>(
    `
      SELECT id, email, name, password_hash, created_at
      FROM users
      WHERE email = $1
    `,
    [email]
  );
  if (result.rowCount === 0) {
    return null;
  }
  return mapRowToUser(result.rows[0]);
};

export const findUserById = async (
  id: string
): Promise<User | null> => {
  const pool = getPool();
  const result = await pool.query<DBUserRow>(
    `
      SELECT id, email, name, password_hash, created_at
      FROM users
      WHERE id = $1
    `,
    [id]
  );
  if (result.rowCount === 0) {
    return null;
  }
  return mapRowToUser(result.rows[0]);
};
