import request from 'supertest';
import app from '../src/app';

describe('Auth endpoints', () => {
  const userPayload = {
    email: 'user@example.com',
    password: 'password123',
    name: 'Test User'
  };

  it('registers a user and returns a token', async () => {
    const response = await request(app).post('/auth/register').send(userPayload);

    expect(response.status).toBe(201);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe(userPayload.email);
    expect(response.body.user.name).toBe(userPayload.name);
  });

  it('prevents duplicate registration', async () => {
    await request(app).post('/auth/register').send(userPayload);
    const response = await request(app).post('/auth/register').send(userPayload);

    expect(response.status).toBe(409);
  });

  it('authenticates existing user', async () => {
    await request(app).post('/auth/register').send(userPayload);
    const response = await request(app).post('/auth/login').send({
      email: userPayload.email,
      password: userPayload.password
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });

  it('rejects invalid credentials', async () => {
    const response = await request(app).post('/auth/login').send({
      email: 'missing@example.com',
      password: 'password123'
    });

    expect(response.status).toBe(401);
  });
});
