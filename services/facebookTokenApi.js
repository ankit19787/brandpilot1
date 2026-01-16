import express from 'express';
// Removed fs, path, dotenv, and .env file logic for Vercel/production. Use process.env only.
const router = express.Router();

// GET /api/facebook-token - returns current Facebook token
// NOTE: This API should be accessed via the backend server (default port 3001), not the frontend (3000).
router.get('/facebook-token', (req, res) => {
  // Always read the latest token from process.env
  const token = process.env.VITE_FACEBOOK_PRODUCTION_TOKEN;
  if (token) {
    res.json({ token });
  } else {
    res.status(404).json({ error: 'Token not found in environment variables' });
  }
});

// POST /api/update-facebook-token
router.post('/update-facebook-token', async (req, res) => {
  // In production (Vercel), updating env vars at runtime is not supported
  res.status(501).json({ error: 'Updating Facebook token at runtime is not supported in production. Please update the environment variable in Vercel dashboard.' });
});

export default router;
