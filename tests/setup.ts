import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { newDb, DataType } from 'pg-mem';
import type { Pool } from 'pg';
import { setPool, closePool } from '../src/db/pool';

let pool: Pool;

beforeAll(async () => {
  const db = newDb({ autoCreateForeignKeyIndices: true });
  db.public.registerFunction({
    name: 'gen_random_uuid',
    returns: DataType.uuid,
    implementation: () => randomUUID()
  });

  const pg = db.adapters.createPg();
  pool = new pg.Pool();
  setPool(pool);

  const migrationPath = path.join(
    __dirname,
    '..',
    'db',
    'migrations',
    '001_init.sql'
  );
  const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
  const statements = migrationSql
    .split(/;\s*\n/)
    .map((stmt) => stmt.trim())
    .filter(
      (stmt) => stmt.length > 0 && !stmt.toUpperCase().startsWith('CREATE EXTENSION')
    );

  for (const statement of statements) {
    await pool.query(statement);
  }
});

beforeEach(async () => {
  await pool.query('TRUNCATE TABLE tasks RESTART IDENTITY CASCADE;');
  await pool.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE;');
});

afterAll(async () => {
  await closePool();
});
