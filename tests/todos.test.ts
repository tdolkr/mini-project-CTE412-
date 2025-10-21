import request from 'supertest';
import app from '../src/app';

const registerAndLogin = async () => {
  const payload = {
    email: 'todo-user@example.com',
    password: 'password123',
    name: 'Todo User'
  };
  await request(app).post('/auth/register').send(payload);
  const loginResponse = await request(app).post('/auth/login').send({
    email: payload.email,
    password: payload.password
  });
  return loginResponse.body.token as string;
};

describe('Todo endpoints', () => {
  it('creates and lists todos for a user', async () => {
    const token = await registerAndLogin();

    const createResponse = await request(app)
      .post('/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Read habit book' });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.todo.title).toBe('Read habit book');

    const listResponse = await request(app)
      .get('/todos')
      .set('Authorization', `Bearer ${token}`);

    expect(listResponse.status).toBe(200);
    expect(Array.isArray(listResponse.body.todos)).toBe(true);
    expect(listResponse.body.todos).toHaveLength(1);
  });

  it('deletes a todo', async () => {
    const token = await registerAndLogin();
    const createResponse = await request(app)
      .post('/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Temporary todo' });

    const todoId = createResponse.body.todo.id;

    const deleteResponse = await request(app)
      .delete(`/todos/${todoId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteResponse.status).toBe(204);

    const listResponse = await request(app)
      .get('/todos')
      .set('Authorization', `Bearer ${token}`);

    expect(listResponse.body.todos).toHaveLength(0);
  });
});
