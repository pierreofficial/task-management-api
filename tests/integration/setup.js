const request = require('supertest');
const prisma = require('../../src/utils/prisma');

async function cleanDatabase() {
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
}

async function registerUser(app, overrides = {}) {
  const payload = {
    email: overrides.email || `user-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
    password: overrides.password || 'password123',
    name: overrides.name || 'Test User',
  };

  const res = await request(app).post('/api/auth/register').send(payload);
  if (res.status !== 201) {
    throw new Error(`Failed to register user: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return {
    ...payload,
    user: res.body.user,
    token: res.body.token,
    auth: { Authorization: `Bearer ${res.body.token}` },
  };
}

module.exports = { prisma, cleanDatabase, registerUser };
