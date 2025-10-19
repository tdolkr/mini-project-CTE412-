import { Pool } from 'pg';
import { env } from '../utils/env';
import { logger } from '../utils/logger';

let pool: Pool | null = null;

const createPool = () => {
  const newPool = new Pool({
    connectionString: env.DATABASE_URL
  });
  newPool.on('error', (err) => {
    logger.error({ err }, 'Unexpected database error');
  });
  return newPool;
};

export const getPool = () => {
  if (!pool) {
    pool = createPool();
  }
  return pool;
};

export const setPool = (customPool: Pool) => {
  pool = customPool;
};

export const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};
