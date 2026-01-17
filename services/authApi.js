import express from 'express';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  // Find user in database
  const user = await prisma.user.findUnique({ where: { username } });
  
  // Hash the provided password using SHA-256 (same as registration)
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
  
  if (!user || user.passwordHash !== passwordHash) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  // Create session in database
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      token: Math.random().toString(36).substr(2),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
  });
  res.json({ 
    token: session.token, 
    role: user.role,
    userId: user.id,
    username: user.username,
    plan: user.plan,
    credits: user.credits,
    maxCredits: user.maxCredits,
    avatarStyle: user.avatarStyle || '6366f1'
  });
});

// GET /api/me
router.get('/me', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const session = await prisma.session.findUnique({ where: { token } });
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  res.json({ id: user.id, username: user.username, role: user.role, plan: user.plan, credits: user.credits });
});

// POST /api/logout
router.post('/logout', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  res.json({ success: true });
});

export default router;
