const request = require('supertest');
const app = require('../../src/app');
const { prisma, cleanDatabase, registerUser } = require('./setup');

describe('Task search and pagination', () => {
  let projectId;
  let auth;

  beforeEach(async () => {
    await cleanDatabase();
    ({ auth } = await registerUser(app));

    const projectRes = await request(app)
      .post('/api/projects')
      .set(auth)
      .send({ name: 'Search Test Project' });
    projectId = projectRes.body.id;

    const titles = [
      'Fix login bug',
      'Design login page',
      'Update database schema',
      'Write documentation',
      'Deploy to production',
    ];

    for (const title of titles) {
      await request(app).post(`/api/projects/${projectId}/tasks`).set(auth).send({ title });
    }
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  test('search returns only matching tasks', async () => {
    const res = await request(app).get('/api/tasks?q=login').set(auth);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data.every((t) => t.title.toLowerCase().includes('login'))).toBe(true);
  });

  test('pagination limits results and reports correct total', async () => {
    const res = await request(app).get('/api/tasks?page=1&limit=2').set(auth);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.pagination.total).toBe(5);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(2);
  });

  test('pagination returns different results on page 2', async () => {
    const page1 = await request(app).get('/api/tasks?page=1&limit=2').set(auth);
    const page2 = await request(app).get('/api/tasks?page=2&limit=2').set(auth);

    const page1Ids = page1.body.data.map((t) => t.id);
    const page2Ids = page2.body.data.map((t) => t.id);

    expect(page1Ids).not.toEqual(page2Ids);
  });

  test('sorts all tasks by due_date using snake_case sort_by', async () => {
    await request(app).post(`/api/projects/${projectId}/tasks`).set(auth).send({
      title: 'Due later', dueDate: '2026-09-20',
    });
    await request(app).post(`/api/projects/${projectId}/tasks`).set(auth).send({
      title: 'Due sooner', dueDate: '2026-08-10',
    });

    const res = await request(app)
      .get('/api/tasks?sort_by=due_date&sort_order=asc')
      .set(auth);

    expect(res.status).toBe(200);
    const dated = res.body.data.filter((t) => t.dueDate);
    expect(dated[0].title).toBe('Due sooner');
    expect(dated[1].title).toBe('Due later');
  });
});
