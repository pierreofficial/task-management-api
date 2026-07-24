const authService = require('../services/auth.service');

async function register(req, res, next) {
  try {
    const { email, password, name } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const result = await authService.register({ email, password, name });
    res.status(201).json(result);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Email already registered' });
    }
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await authService.login({ email, password });
    if (!result) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
