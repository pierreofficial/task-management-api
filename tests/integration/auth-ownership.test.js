const request = require('supertest');
const app = require('../../src/app');
const { prisma, cleanDatabase, registerUser } = require('./setup');

describe('Auth and ownership', () => {
  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  test('register returns a user and JWT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@example.com', password: 'password123', name: 'New User' });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('new@example.com');
    expect(res.body.token).toBeTruthy();
  });

  test('login returns a JWT for valid credentials', async () => {
    await registerUser(app, { email: 'login@example.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  test('protected routes reject missing token', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(401);
  });

  test('users cannot access another user project or task', async () => {
    const alice = await registerUser(app, { email: 'alice@example.com' });
    const bob = await registerUser(app, { email: 'bob@example.com' });

    const projectRes = await request(app)
      .post('/api/projects')
      .set(alice.auth)
      .send({ name: 'Alice Project' });
    const projectId = projectRes.body.id;

    const taskRes = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set(alice.auth)
      .send({ title: 'Alice Task' });
    const taskId = taskRes.body.id;

    const bobProject = await request(app)
      .get(`/api/projects/${projectId}`)
      .set(bob.auth);
    expect(bobProject.status).toBe(404);

    const bobTask = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set(bob.auth);
    expect(bobTask.status).toBe(404);

    const bobList = await request(app)
      .get('/api/tasks')
      .set(bob.auth);
    expect(bobList.status).toBe(200);
    expect(bobList.body.data).toEqual([]);
  });
});
