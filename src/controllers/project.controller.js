const projectService = require('../services/project.service');

async function createProject(req, res, next) {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const project = await projectService.createProject(req.user.id, { name, description });
    res.status(201).json(project);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Project name already exists' });
    }
    next(err);
  }
}

async function getAllProjects(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await projectService.getAllProjects(req.user.id, { page, limit });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getProjectById(req, res, next) {
  try {
    const project = await projectService.getProjectById(req.params.id, req.user.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (err) {
    next(err);
  }
}

async function updateProject(req, res, next) {
  try {
    const { name, description } = req.body;

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({ error: 'Project name cannot be empty' });
    }

    const project = await projectService.updateProject(
      req.params.id,
      req.user.id,
      { name, description },
    );
    res.json(project);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Project name already exists' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Project not found' });
    }
    next(err);
  }
}

async function deleteProject(req, res, next) {
  try {
    await projectService.deleteProject(req.params.id, req.user.id);
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Project not found' });
    }
    next(err);
  }
}

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
