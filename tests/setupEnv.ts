process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgres://testuser:testpass@localhost:5432/testdb';
