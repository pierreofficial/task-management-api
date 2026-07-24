const prisma = require('../utils/prisma');
const { buildTaskWhere, buildTaskOrderBy } = require('../utils/taskQuery');

function ownedTaskWhere(ownerId, extra = {}) {
  return {
    ...extra,
    deletedAt: null,
    project: { ownerId: Number(ownerId), deletedAt: null },
  };
}

async function createTask(projectId, data) {
  return prisma.task.create({ data: { ...data, projectId: Number(projectId) } });
}

async function getTasksByProject(projectId, query) {
  const { page = 1, limit = 10 } = query;
  const skip = (page - 1) * limit;

  const where = { ...buildTaskWhere(query), projectId: Number(projectId), deletedAt: null };
  const orderBy = buildTaskOrderBy(query);

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({ where, orderBy, skip, take: Number(limit) }),
    prisma.task.count({ where }),
  ]);

  return { data: tasks, pagination: { page: Number(page), limit: Number(limit), total } };
}

async function getAllTasks(ownerId, query) {
  const { page = 1, limit = 10 } = query;
  const skip = (page - 1) * limit;

  const where = ownedTaskWhere(ownerId, buildTaskWhere(query));
  const orderBy = buildTaskOrderBy(query);

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy,
      skip,
      take: Number(limit),
      include: { project: { select: { id: true, name: true } } },
    }),
    prisma.task.count({ where }),
  ]);

  return { data: tasks, pagination: { page: Number(page), limit: Number(limit), total } };
}

async function getTaskById(id, ownerId) {
  return prisma.task.findFirst({
    where: ownedTaskWhere(ownerId, { id: Number(id) }),
    include: { project: { select: { id: true, name: true } } },
  });
}

async function updateTask(id, ownerId, data) {
  const existing = await getTaskById(id, ownerId);
  if (!existing) {
    const err = new Error('Task not found');
    err.code = 'P2025';
    throw err;
  }

  return prisma.task.update({ where: { id: Number(id) }, data });
}

async function deleteTask(id, ownerId) {
  const existing = await getTaskById(id, ownerId);
  if (!existing) {
    const err = new Error('Task not found');
    err.code = 'P2025';
    throw err;
  }

  return prisma.task.update({
    where: { id: Number(id) },
    data: { deletedAt: new Date() },
  });
}

module.exports = {
  createTask,
  getTasksByProject,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
};
