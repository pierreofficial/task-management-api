const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const taskRoutes = require('./task.routes');

router.post('/', projectController.createProject);
router.get('/', projectController.getAllProjects);
router.get('/:id', projectController.getProjectById);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

router.use('/:id/tasks', taskRoutes)

module.exports = router;