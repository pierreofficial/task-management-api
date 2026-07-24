const request = require('supertest');
const app = require('../../src/app');
const { prisma, cleanDatabase, registerUser } = require('./setup');

describe('Project lifecycle flow', () => {
  let auth;

  beforeEach(async () => {
    await cleanDatabase();
    ({ auth } = await registerUser(app));
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  test('create project -> add task -> mark done -> delete project cascades', async () => {
    const projectRes = await request(app)
      .post('/api/projects')
      .set(auth)
      .send({ name: 'Test Project' });

    expect(projectRes.status).toBe(201);
    const projectId = projectRes.body.id;

    const taskRes = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set(auth)
      .send({ title: 'Test Task', priority: 'high' });

    expect(taskRes.status).toBe(201);
    expect(taskRes.body.status).toBe('todo');
    const taskId = taskRes.body.id;

    const updateRes = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set(auth)
      .send({ status: 'done' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.status).toBe('done');

    const deleteRes = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set(auth);
    expect(deleteRes.status).toBe(204);

    const taskCheckRes = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set(auth);
    expect(taskCheckRes.status).toBe(404);

    const projectCheckRes = await request(app)
      .get(`/api/projects/${projectId}`)
      .set(auth);
    expect(projectCheckRes.status).toBe(404);
  });
});
