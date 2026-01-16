import express from 'express';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
const envLocalPath = path.join(process.cwd(), '.env.local');
const envPath = path.join(process.cwd(), '.env');
const dotenvPath = fs.existsSync(envLocalPath) ? envLocalPath : envPath;
const router = express.Router();

// GET /api/facebook-token - returns current Facebook token
// NOTE: This API should be accessed via the backend server (default port 3001), not the frontend (3000).
router.get('/facebook-token', (req, res) => {
  // Always read the latest token from .env file
  try {
    const envContent = fs.readFileSync(dotenvPath, 'utf8');
    const match = envContent.match(/^VITE_FACEBOOK_PRODUCTION_TOKEN=(.*)$/m);
    const token = match ? match[1].trim() : null;
    if (token) {
      res.json({ token });
    } else {
      res.status(404).json({ error: 'Token not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to read .env file' });
  }
});

// POST /api/update-facebook-token
router.post('/update-facebook-token', async (req, res) => {
  const { newToken } = req.body;
  if (!newToken || typeof newToken !== 'string') {
    return res.status(400).json({ error: 'Missing newToken' });
  }
  try {
    let envContent = fs.readFileSync(dotenvPath, 'utf8');
    envContent = envContent.replace(/VITE_FACEBOOK_PRODUCTION_TOKEN=.*/,
      `VITE_FACEBOOK_PRODUCTION_TOKEN=${newToken}`);
    fs.writeFileSync(dotenvPath, envContent, 'utf8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
