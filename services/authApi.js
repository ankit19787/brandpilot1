import express from 'express';
import bodyParser from 'body-parser';

const router = express.Router();

// Demo users (for demo only, do not use in production)
const users = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'demo1', password: 'demo123', role: 'user' },
  { username: 'demo2', password: 'demo123', role: 'user' }
];

// Simple session store (in-memory)
const sessions = {};

// POST /api/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  // Create a simple session token
  const token = Math.random().toString(36).substr(2);
  sessions[token] = { username: user.username, role: user.role };
  res.json({ token, role: user.role });
});

// GET /api/me
router.get('/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !sessions[token]) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json(sessions[token]);
});

// POST /api/logout
router.post('/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token && sessions[token]) {
    delete sessions[token];
  }
  res.json({ success: true });
});

export default router;
