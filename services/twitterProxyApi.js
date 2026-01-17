import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// POST /api/twitter/2/tweets - Proxy to Twitter API
router.post('/twitter/2/tweets', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Missing tweet text' });
    }
    // Twitter credentials from .env
    // Fetch credentials from Config table using Prisma or API
    const prisma = req.app.get('prisma');
    const config = await prisma.config.findMany();
    const configMap = Object.fromEntries(config.map(c => [c.key, c.value]));
    const apiKey = configMap['x_api_key'];
    const apiSecret = configMap['x_api_secret'];
    const accessToken = configMap['x_access_token'];
    const accessSecret = configMap['x_access_secret'];
    const twitterApiUrl = configMap['twitter_api_url'] || 'https://api.twitter.com';
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
