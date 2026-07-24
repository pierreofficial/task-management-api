const { PrismaClient } = require('../generated/prisma-client-js');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  const alice = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      passwordHash,
      name: 'Alice',
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      passwordHash,
      name: 'Bob',
    },
  });

  const website = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      description: 'Company website overhaul',
      ownerId: alice.id,
    },
  });

  const mobile = await prisma.project.create({
    data: {
      name: 'Mobile App',
      description: 'iOS and Android task tracker',
      ownerId: bob.id,
    },
  });

  await prisma.task.createMany({
    data: [
      { projectId: website.id, title: 'Design homepage mockup', status: 'done', priority: 'high' },
      { projectId: website.id, title: 'Implement responsive nav', status: 'in_progress', priority: 'medium', dueDate: new Date('2026-08-10') },
      { projectId: website.id, title: 'Set up analytics', status: 'todo', priority: 'low' },
      { projectId: mobile.id, title: 'Design login screen', status: 'todo', priority: 'high', dueDate: new Date('2026-08-05') },
      { projectId: mobile.id, title: 'Set up push notifications', status: 'todo', priority: 'medium' },
    ],
  });

  console.log('Seeding complete.');
  console.log('Users: alice@example.com / bob@example.com (password: password123)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
