const prisma = require('../utils/prisma');

async function createProject(ownerId, data) {
  return prisma.project.create({
    data: { ...data, ownerId: Number(ownerId) },
  });
}

async function getAllProjects(ownerId, { page = 1, limit = 10 }) {
  const skip = (page - 1) * limit;
  const where = { ownerId: Number(ownerId), deletedAt: null };

  const [projects, total] = await Promise.all([
    prisma.project.findMany({ where, skip, take: Number(limit) }),
    prisma.project.count({ where }),
  ]);

  return {
    data: projects,
    pagination: { page: Number(page), limit: Number(limit), total },
  };
}

async function getProjectById(id, ownerId) {
  return prisma.project.findFirst({
    where: { id: Number(id), ownerId: Number(ownerId), deletedAt: null },
  });
}

async function updateProject(id, ownerId, data) {
  const existing = await getProjectById(id, ownerId);
  if (!existing) {
    const err = new Error('Project not found');
    err.code = 'P2025';
    throw err;
  }

  return prisma.project.update({ where: { id: Number(id) }, data });
}

async function deleteProject(id, ownerId) {
  const existing = await getProjectById(id, ownerId);
  if (!existing) {
    const err = new Error('Project not found');
    err.code = 'P2025';
    throw err;
  }

  const now = new Date();

  return prisma.$transaction([
    prisma.task.updateMany({
      where: { projectId: Number(id), deletedAt: null },
      data: { deletedAt: now },
    }),
    prisma.project.update({
      where: { id: Number(id) },
      data: { deletedAt: now },
    }),
  ]);
}

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
