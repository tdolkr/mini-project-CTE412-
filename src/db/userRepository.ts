import { getPool } from './pool';
import { User } from '../types';

interface CreateUserInput {
  email: string;
  passwordHash: string;
  name: string;
}

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  created_at: Date;
};

const mapUserRow = (row: UserRow): User => ({
  id: row.id,
  email: row.email,
  name: row.name,
  passwordHash: row.password_hash,
  createdAt: row.created_at
});

export const createUser = async (input: CreateUserInput): Promise<User> => {
  const pool = getPool();
  const result = await pool.query(
    `
      INSERT INTO users (email, password_hash, name)
      VALUES ($1, $2, $3)
      RETURNING id, email, password_hash, name, created_at
    `,
    [input.email, input.passwordHash, input.name]
  );
  return mapUserRow(result.rows[0]);
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT id, email, password_hash, name, created_at
      FROM users
      WHERE email = $1
    `,
    [email]
  );
  if (result.rowCount === 0) {
    return null;
  }
  return mapUserRow(result.rows[0]);
};
