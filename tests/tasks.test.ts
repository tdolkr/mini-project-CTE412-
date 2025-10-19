import request from 'supertest';
import app from '../src/app';

const registerAndLogin = async () => {
  const payload = {
    email: 'tasker@example.com',
    password: 'password123',
    name: 'Task User'
  };
  await request(app).post('/auth/register').send(payload);
  const loginResponse = await request(app).post('/auth/login').send({
    email: payload.email,
    password: payload.password
  });
  return loginResponse.body.token as string;
};

describe('Task endpoints', () => {
  it('creates and lists tasks for a user', async () => {
    const token = await registerAndLogin();
    const createResponse = await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Task' });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.task.title).toBe('Test Task');

    const listResponse = await request(app)
      .get('/tasks')
      .set('Authorization', `Bearer ${token}`);

    expect(listResponse.status).toBe(200);
    expect(Array.isArray(listResponse.body.tasks)).toBe(true);
    expect(listResponse.body.tasks).toHaveLength(1);
  });

  it('updates a task status', async () => {
    const token = await registerAndLogin();
    const { body } = await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Update Task' });

    const taskId = body.task.id;

    const updateResponse = await request(app)
      .put(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'done' });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.task.status).toBe('done');
  });

  it('deletes a task', async () => {
    const token = await registerAndLogin();
    const { body } = await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Delete Task' });

    const taskId = body.task.id;

    const deleteResponse = await request(app)
      .delete(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteResponse.status).toBe(204);

    const getResponse = await request(app)
      .get(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getResponse.status).toBe(404);
  });
});
