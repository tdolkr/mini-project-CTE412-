process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://test-user:test-pass@test-host:5432/test-db';
