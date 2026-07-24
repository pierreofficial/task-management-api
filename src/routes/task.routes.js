const express = require('express');
const router = express.Router({ mergeParams: true });
const taskController = require('../controllers/task.controller');

router.post('/', taskController.createTask);
router.get('/', taskController.getTasksByProject);

module.exports = router;