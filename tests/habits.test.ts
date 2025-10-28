import request from 'supertest';
import app from '../src/app';

const registerAndLogin = async () => {
  const payload = {
    email: 'habit-user@example.com',
    password: 'password123',
    name: 'Habit User'
  };
  await request(app).post('/auth/register').send(payload);
  const loginResponse = await request(app).post('/auth/login').send({
    email: payload.email,
    password: payload.password
  });
  return loginResponse.body.token as string;
};

describe('Habit endpoints', () => {
  it('creates a habit and marks completion', async () => {
    const token = await registerAndLogin();

    const createResponse = await request(app)
      .post('/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Morning meditation' });

    expect(createResponse.status).toBe(201);
    const habitId = createResponse.body.habit.id as string;

    const markResponse = await request(app)
      .post(`/habits/${habitId}/checkins`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(markResponse.status).toBe(204);

    const listResponse = await request(app)
      .get('/habits')
      .set('Authorization', `Bearer ${token}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.habits[0].entries.length).toBeGreaterThanOrEqual(1);
  });

  it('updates habit details', async () => {
    const token = await registerAndLogin();

    const createResponse = await request(app)
      .post('/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Read book', description: '15 minutes' });

    const habitId = createResponse.body.habit.id as string;

    const updateResponse = await request(app)
      .put(`/habits/${habitId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Read novel', description: '20 minutes' });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.habit.name).toBe('Read novel');
    expect(updateResponse.body.habit.description).toBe('20 minutes');
  });
});
