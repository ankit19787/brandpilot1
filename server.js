// Minimal Express server to use facebookTokenApi.js
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import facebookTokenApi from './services/facebookTokenApi.js';
import twitterProxyApi from './services/twitterProxyApi.js';
import authApi from './services/authApi.js';
import { PrismaClient } from '@prisma/client';
import * as geminiServer from './services/gemini.server.js';

// Load environment variables from .env.local or .env (whichever exists)
import fs from 'fs';
// dotenv removed for Vercel/production. Use process.env only.

const app = express();
const prisma = new PrismaClient();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use('/api', facebookTokenApi);
app.use('/api', twitterProxyApi);
app.use('/api', authApi);

// Token validation endpoint
app.post('/api/validate-token', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // Check if session exists and is not expired
    const session = await prisma.session.findUnique({ 
      where: { token },
      include: { user: true }
    });
    
    if (!session) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Check if session is expired
    if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
      // Delete expired session
      await prisma.session.delete({ where: { token } });
      return res.status(401).json({ error: 'Token expired' });
    }
    
    return res.json({ 
      valid: true, 
      user: {
        id: session.user.id,
        username: session.user.username,
        role: session.user.role
      }
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(401).json({ error: 'Token validation failed' });
  }
});

// Config management endpoints
app.get('/api/config', async (req, res) => {
  try {
    const configs = await prisma.config.findMany();
    res.json(configs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch configs' });
  }
});

app.post('/api/config', async (req, res) => {
  const { key, value } = req.body;
  if (!key || typeof value === 'undefined') {
    return res.status(400).json({ error: 'Key and value required' });
  }
  try {
    const config = await prisma.config.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update config' });
  }
});

// Gemini API endpoints
app.post('/api/brand-dna', async (req, res) => {
  try {
    const { pastPosts } = req.body;
    const result = await geminiServer.analyzeBrandDNA(pastPosts);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/content-strategy', async (req, res) => {
  try {
    const { dna } = req.body;
    const result = await geminiServer.generateContentStrategy(dna);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate-post', async (req, res) => {
  try {
    const { platform, topic, dna } = req.body;
    const result = await geminiServer.generatePost(platform, topic, dna);
    res.json({ content: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate-image', async (req, res) => {
  try {
    const { topic, dna } = req.body;
    const result = await geminiServer.generateImage(topic, dna);
    res.json({ imageUrl: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/publish', async (req, res) => {
  try {
    const { platform, content, metadata } = req.body;
    console.log('Publish request:', { platform, content, metadata });
    const result = await geminiServer.publishToPlatform(platform, content, metadata);
    res.json(result);
  } catch (error) {
    console.error('Publish error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/monetization-plan', async (req, res) => {
  try {
    const { dna, metrics } = req.body;
    const result = await geminiServer.getMonetizationPlan(dna, metrics);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    console.log('Creating post:', req.body);
    const result = await geminiServer.createPost(req.body);
    console.log('Post created successfully:', result);
    res.json(result);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/posts/all', async (req, res) => {
  try {
    const result = await geminiServer.getAllPosts();
    res.json(result);
  } catch (error) {
    console.error('Error fetching all posts:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/posts/:userId', async (req, res) => {
  try {
    const result = await geminiServer.getUserPosts(req.params.userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/logs', async (req, res) => {
  try {
    const result = await geminiServer.createLog(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/logs/:userId', async (req, res) => {
  try {
    const result = await geminiServer.getUserLogs(req.params.userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
