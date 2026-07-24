const request = require('supertest');
const app = require('../../src/app');
const { prisma, cleanDatabase, registerUser } = require('./setup');

describe('Task filtering', () => {
  let projectId;
  let auth;

  beforeEach(async () => {
    await cleanDatabase();
    ({ auth } = await registerUser(app));

    const projectRes = await request(app)
      .post('/api/projects')
      .set(auth)
      .send({ name: 'Filter Test Project' });
    projectId = projectRes.body.id;

    await request(app).post(`/api/projects/${projectId}/tasks`).set(auth).send({
      title: 'Urgent bug fix', status: 'todo', priority: 'high',
    });
    await request(app).post(`/api/projects/${projectId}/tasks`).set(auth).send({
      title: 'Refactor code', status: 'in_progress', priority: 'medium',
    });
    await request(app).post(`/api/projects/${projectId}/tasks`).set(auth).send({
      title: 'Update docs', status: 'todo', priority: 'low',
    });
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  test('filters tasks by status', async () => {
    const res = await request(app).get('/api/tasks?status=todo').set(auth);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data.every((t) => t.status === 'todo')).toBe(true);
  });

  test('filters tasks by priority', async () => {
    const res = await request(app).get('/api/tasks?priority=high').set(auth);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('Urgent bug fix');
  });

  test('filters tasks by status AND priority combined', async () => {
    const res = await request(app).get('/api/tasks?status=todo&priority=low').set(auth);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('Update docs');
  });

  test('filters tasks under a project by status and priority', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}/tasks?status=todo&priority=high`)
      .set(auth);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('Urgent bug fix');
  });

  test('sorts project tasks by due_date ascending', async () => {
    await request(app).post(`/api/projects/${projectId}/tasks`).set(auth).send({
      title: 'Later due', priority: 'medium', dueDate: '2026-09-15',
    });
    await request(app).post(`/api/projects/${projectId}/tasks`).set(auth).send({
      title: 'Sooner due', priority: 'medium', dueDate: '2026-08-01',
    });

    const res = await request(app)
      .get(`/api/projects/${projectId}/tasks?sort_by=due_date&sort_order=asc`)
      .set(auth);

    expect(res.status).toBe(200);
    const dated = res.body.data.filter((t) => t.dueDate);
    expect(dated[0].title).toBe('Sooner due');
    expect(dated[1].title).toBe('Later due');
  });

  test('rejects invalid status on update with 400', async () => {
    const createRes = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set(auth)
      .send({ title: 'Enum check' });

    const res = await request(app)
      .put(`/api/tasks/${createRes.body.id}`)
      .set(auth)
      .send({ status: 'cancelled' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/status/i);
  });

  test('rejects invalid priority on create with 400', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set(auth)
      .send({ title: 'Bad priority', priority: 'urgent' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/priority/i);
  });
});
