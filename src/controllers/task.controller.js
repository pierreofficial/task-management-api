const taskService = require('../services/task.service');
const projectService = require('../services/project.service');
const {
  isValidDueDate,
  isValidStatus,
  isValidPriority,
} = require('../utils/validation');

function validateStatusAndPriority(status, priority) {
  if (status !== undefined && status !== null && !isValidStatus(status)) {
    return 'Invalid status. Must be todo, in_progress, or done';
  }

  if (priority !== undefined && priority !== null && !isValidPriority(priority)) {
    return 'Invalid priority. Must be low, medium, or high';
  }

  return null;
}

function validateTaskQueryFilters(query) {
  if (query.status && !isValidStatus(query.status)) {
    return 'Invalid status filter. Must be todo, in_progress, or done';
  }
  if (query.priority && !isValidPriority(query.priority)) {
    return 'Invalid priority filter. Must be low, medium, or high';
  }
  return null;
}

async function createTask(req, res, next) {
  try {
    const { id: projectId } = req.params;
    const { title, description, status, priority, dueDate } = req.body;

    const project = await projectService.getProjectById(projectId, req.user.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const enumError = validateStatusAndPriority(status, priority);
    if (enumError) {
      return res.status(400).json({ error: enumError });
    }

    if (!isValidDueDate(dueDate)) {
      return res.status(400).json({ error: 'Due date cannot be in the past' });
    }

    const task = await taskService.createTask(projectId, {
      title,
      description,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
    });

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

async function getTasksByProject(req, res, next) {
  try {
    const { id: projectId } = req.params;

    const project = await projectService.getProjectById(projectId, req.user.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const filterError = validateTaskQueryFilters(req.query);
    if (filterError) {
      return res.status(400).json({ error: filterError });
    }

    const result = await taskService.getTasksByProject(projectId, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getTaskById(req, res, next) {
  try {
    const task = await taskService.getTaskById(req.params.id, req.user.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (err) {
    next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const { title, description, status, priority, dueDate } = req.body;

    if (title !== undefined && !title.trim()) {
      return res.status(400).json({ error: 'Task title cannot be empty' });
    }

    const enumError = validateStatusAndPriority(status, priority);
    if (enumError) {
      return res.status(400).json({ error: enumError });
    }

    if (dueDate !== undefined && !isValidDueDate(dueDate)) {
      return res.status(400).json({ error: 'Due date cannot be in the past' });
    }

    if (status === 'todo') {
      const existing = await taskService.getTaskById(req.params.id, req.user.id);
      if (existing && existing.status === 'done') {
        console.log(`[STATUS TRANSITION] Task ${req.params.id} moved from done -> todo (reopened)`);
      }
    }

    const data = { title, description, status, priority };
    if (dueDate !== undefined) {
      data.dueDate = dueDate ? new Date(dueDate) : null;
    }

    const task = await taskService.updateTask(req.params.id, req.user.id, data);
    res.json(task);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Task not found' });
    }
    next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    await taskService.deleteTask(req.params.id, req.user.id);
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Task not found' });
    }
    next(err);
  }
}

async function getAllTasks(req, res, next) {
  try {
    const filterError = validateTaskQueryFilters(req.query);
    if (filterError) {
      return res.status(400).json({ error: filterError });
    }

    const result = await taskService.getAllTasks(req.user.id, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createTask,
  getTasksByProject,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
};
