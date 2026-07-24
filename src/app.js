require('dotenv').config();
const express = require('express');
const authenticate = require('./middlewares/auth.middleware');
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const taskDirectRoutes = require('./routes/task-direct.routes');

const app = express();

app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);

app.use('/api/projects', authenticate, projectRoutes);
app.use('/api/tasks', authenticate, taskDirectRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
