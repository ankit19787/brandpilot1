import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// POST /api/twitter/2/tweets - Proxy to Twitter API
router.post('/twitter/2/tweets', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Missing tweet text' });
    }
    // Twitter credentials from .env
    const apiKey = process.env.VITE_X_API_KEY;
    const apiSecret = process.env.VITE_X_API_SECRET;
    const accessToken = process.env.VITE_X_ACCESS_TOKEN;
    const accessSecret = process.env.VITE_X_ACCESS_SECRET;
    const twitterApiUrl = process.env.VITE_TWITTER_API_URL || 'https://api.twitter.com';
    const url = `${twitterApiUrl}/2/tweets`;

    // Forward headers from client (including Authorization)
    const headers = {
      'Content-Type': 'application/json',
      ...(req.headers.authorization ? { 'Authorization': req.headers.authorization } : {})
    };

    // Forward the request to Twitter API
    const twitterRes = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text })
    });
    const data = await twitterRes.json();
    if (!twitterRes.ok) {
      return res.status(twitterRes.status).json(data);
    }
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
