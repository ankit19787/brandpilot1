// Minimal Express server to use facebookTokenApi.js
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import facebookTokenApi from './services/facebookTokenApi.js';
import twitterProxyApi from './services/twitterProxyApi.js';
import authApi from './services/authApi.js';
import { PrismaClient } from '@prisma/client';
import * as geminiServer from './services/gemini.server.js';
import HyperPayService from './services/hyperPayService.js';
import emailService from './services/emailService.js';

// Load environment variables from .env.local or .env (whichever exists)
import fs from 'fs';
// dotenv removed for Vercel/production. Use process.env only.

const app = express();
const prisma = new PrismaClient();

// Attach prisma to app so routes can access it
app.set('prisma', prisma);

// HyperPay service will be initialized on-demand from database config
let hyperPayService = null;

// Load HyperPay config from database
async function getHyperPayService() {
  if (hyperPayService) return hyperPayService;
  
  try {
    const configs = await prisma.config.findMany({
      where: {
        key: {
          in: ['HYPERPAY_ENTITY_ID', 'HYPERPAY_ACCESS_TOKEN', 'HYPERPAY_MODE', 'HYPERPAY_BRANDS']
        }
      }
    });
    
    const configMap = {};
    configs.forEach(c => configMap[c.key] = c.value);
    
    if (!configMap.HYPERPAY_ENTITY_ID || !configMap.HYPERPAY_ACCESS_TOKEN) {
      return null;
    }
    
    const hyperPayConfig = {
      entityId: configMap.HYPERPAY_ENTITY_ID,
      accessToken: configMap.HYPERPAY_ACCESS_TOKEN,
      mode: configMap.HYPERPAY_MODE || 'test',
      brands: (configMap.HYPERPAY_BRANDS || 'VISA,MASTER').split(',')
    };
    
    hyperPayService = new HyperPayService(hyperPayConfig);
    return hyperPayService;
  } catch (error) {
    console.error('Failed to load HyperPay config:', error);
    return null;
  }
}

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Test endpoint to verify frontend-backend connection
app.get('/api/test-connection', (req, res) => {
  console.log('🧪 Test connection endpoint called from frontend');
  res.json({ 
    status: 'connected', 
    message: 'Frontend successfully connected to backend!',
    timestamp: new Date().toISOString(),
    serverPort: 3001
  });
});

// API statistics tracking
const apiStats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalLatency: 0,
  requestsLast24h: 0,
  last24hTimestamp: Date.now()
};

// Middleware to track API statistics
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Track request
  apiStats.totalRequests++;
  
  // Reset 24h counter if needed
  if (Date.now() - apiStats.last24hTimestamp > 24 * 60 * 60 * 1000) {
    apiStats.requestsLast24h = 0;
    apiStats.last24hTimestamp = Date.now();
  }
  apiStats.requestsLast24h++;
  
  // Track response
  const originalSend = res.send;
  res.send = function(data) {
    const latency = Date.now() - startTime;
    apiStats.totalLatency += latency;
    
    if (res.statusCode >= 200 && res.statusCode < 400) {
      apiStats.successfulRequests++;
    } else {
      apiStats.failedRequests++;
    }
    
    originalSend.call(this, data);
  };
  
  next();
});

app.use('/api', facebookTokenApi);
app.use('/api', twitterProxyApi);
app.use('/api', authApi);

// Simplified Twitter post endpoint - handles OAuth server-side
app.post('/api/twitter/post', async (req, res) => {
  console.log('=== /api/twitter/post endpoint hit ===');
  console.log('Request body:', req.body);
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Missing tweet text' });
    }

    console.log('Tweet text:', text);

    // Get credentials from database
    const configs = await prisma.config.findMany({
      where: {
        key: { in: ['x_api_key', 'x_api_secret', 'x_access_token', 'x_access_secret', 'twitter_api_url'] }
      }
    });
    const creds = Object.fromEntries(configs.map(c => [c.key, c.value]));
    
    if (!creds.x_api_key || !creds.x_api_secret || !creds.x_access_token || !creds.x_access_secret) {
      return res.status(500).json({ error: 'Twitter credentials not configured' });
    }

    const twitterApiUrl = creds.twitter_api_url || 'https://api.twitter.com';
    const url = `${twitterApiUrl}/2/tweets`;

    // Generate OAuth 1.0a signature
    const crypto = await import('crypto');
    const nonce = crypto.randomBytes(16).toString('hex');
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const oauthParams = {
      oauth_consumer_key: creds.x_api_key,
      oauth_token: creds.x_access_token,
      oauth_nonce: nonce,
      oauth_timestamp: timestamp,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_version: '1.0',
    };

    // Generate signature
    const rfc3986Encode = (str) => encodeURIComponent(str).replace(/[!*'()]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
    const paramString = Object.keys(oauthParams).sort().map(k => `${rfc3986Encode(k)}=${rfc3986Encode(oauthParams[k])}`).join('&');
    const baseString = `POST&${rfc3986Encode(url)}&${rfc3986Encode(paramString)}`;
    const signingKey = `${rfc3986Encode(creds.x_api_secret)}&${rfc3986Encode(creds.x_access_secret)}`;
    const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');
    oauthParams.oauth_signature = signature;

    const authHeader = 'OAuth ' + Object.keys(oauthParams).sort().map(k => `${rfc3986Encode(k)}="${rfc3986Encode(oauthParams[k])}"`).join(', ');

    // Post to Twitter
    const fetch = (await import('node-fetch')).default;
    const twitterRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text })
    });

    const data = await twitterRes.json();
    
    if (!twitterRes.ok) {
      console.error('Twitter API Error:', data);
      return res.status(twitterRes.status).json(data);
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('Twitter post error:', err);
    res.status(500).json({ error: err.message });
  }
});

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
        role: session.user.role,
        plan: session.user.plan,
        credits: session.user.credits,
        maxCredits: session.user.maxCredits,
        avatarStyle: session.user.avatarStyle || '6366f1'
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

// Get single config value
app.get('/api/config/:key', async (req, res) => {
  const { key } = req.params;
  try {
    const config = await prisma.config.findUnique({
      where: { key }
    });
    if (!config) {
      return res.status(404).json({ error: 'Config not found' });
    }
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

app.delete('/api/config/:key', async (req, res) => {
  const { key } = req.params;
  try {
    await prisma.config.delete({
      where: { key }
    });
    res.json({ success: true, message: `Config ${key} deleted` });
  } catch (err) {
    // If record doesn't exist, still return success
    res.json({ success: true, message: `Config ${key} not found or already deleted` });
  }
});

// Gemini API endpoints
app.post('/api/brand-dna', async (req, res) => {
  try {
    const { pastPosts, userId } = req.body;
    
    // Deduct credits if userId is provided
    if (userId) {
      const creditCost = 50; // Cost for Brand DNA analysis
      
      // Check if user has enough credits
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (user.credits < creditCost) {
        return res.status(400).json({ 
          error: 'Insufficient credits', 
          required: creditCost,
          available: user.credits 
        });
      }
      
      // Deduct credits first
      const balanceBefore = user.credits;
      const balanceAfter = user.credits - creditCost;
      
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { credits: balanceAfter }
        }),
        prisma.creditTransaction.create({
          data: {
            userId,
            amount: -creditCost,
            action: 'brand_dna',
            description: 'Generated Brand DNA analysis',
            balanceBefore,
            balanceAfter
          }
        })
      ]);
      
      console.log(`Deducted ${creditCost} credits from user ${userId} for Brand DNA analysis. New balance: ${balanceAfter}`);
      
      // Try to analyze - if it fails, refund the credits
      try {
        const result = await geminiServer.analyzeBrandDNA(pastPosts);
        
        // Save Brand DNA to database
        await prisma.brandDNA.updateMany({
          where: { userId, isActive: true },
          data: { isActive: false }
        });
        
        await prisma.brandDNA.create({
          data: {
            userId,
            voice: result.voice,
            personality: JSON.stringify(result.personality),
            contentPillars: JSON.stringify(result.contentPillars),
            audienceType: result.audienceType,
            writingStyle: result.writingStyle,
            inputData: pastPosts,
            isActive: true
          }
        });
        
        console.log(`Saved Brand DNA for user ${userId}`);
        
        // Send email notification
        if (user.email) {
          await emailService.sendBrandDNAGeneratedEmail(user.email, user.username);
        }
        
        return res.json({ ...result, credits: balanceAfter });
      } catch (analysisError) {
        console.error('Brand DNA analysis failed, refunding credits:', analysisError);
        
        // Refund the credits
        await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: { credits: balanceBefore }
          }),
          prisma.creditTransaction.create({
            data: {
              userId,
              amount: creditCost,
              action: 'refund_brand_dna_failed',
              description: `Refund: Brand DNA analysis failed - ${analysisError.message}`,
              balanceBefore: balanceAfter,
              balanceAfter: balanceBefore
            }
          })
        ]);
        
        console.log(`Refunded ${creditCost} credits to user ${userId}. Balance restored to: ${balanceBefore}`);
        return res.status(500).json({ 
          error: analysisError.message || 'Brand DNA analysis failed',
          refunded: true,
          credits: balanceBefore
        });
      }
    }
    
    // No userId provided, analyze without credits but still save if possible
    const result = await geminiServer.analyzeBrandDNA(pastPosts);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Brand DNA for user
app.get('/api/brand-dna/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const brandDNA = await prisma.brandDNA.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!brandDNA) {
      return res.status(404).json({ error: 'No Brand DNA found for user' });
    }
    
    res.json({
      dna: {
        voice: brandDNA.voice,
        personality: JSON.parse(brandDNA.personality),
        contentPillars: JSON.parse(brandDNA.contentPillars),
        audienceType: brandDNA.audienceType,
        writingStyle: brandDNA.writingStyle,
        createdAt: brandDNA.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/content-strategy', async (req, res) => {
  try {
    const { dna, userId } = req.body;
    console.log('🔍 Content Strategy API called with userId:', userId, 'dna:', !!dna);
    
    // Deduct credits if userId is provided
    if (userId) {
      const creditCost = 25; // Cost for Content Strategy generation
      
      // Check if user has enough credits
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (user.credits < creditCost) {
        return res.status(400).json({ 
          error: 'Insufficient credits', 
          required: creditCost,
          available: user.credits 
        });
      }
      
      // Deduct credits first
      const balanceBefore = user.credits;
      const balanceAfter = user.credits - creditCost;
      
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { credits: balanceAfter }
        }),
        prisma.creditTransaction.create({
          data: {
            userId,
            amount: -creditCost,
            action: 'content_strategy',
            description: 'Generated Content Strategy',
            balanceBefore,
            balanceAfter
          }
        })
      ]);
      
      console.log(`Deducted ${creditCost} credits from user ${userId} for Content Strategy. New balance: ${balanceAfter}`);
      
      // Try to generate strategy - if it fails, refund credits
      try {
        const result = await geminiServer.generateContentStrategy(dna);
        
        // Save Content Strategy to database
        await prisma.contentStrategy.updateMany({
          where: { userId, isActive: true },
          data: { isActive: false }
        });
        
        await prisma.contentStrategy.create({
          data: {
            userId,
            dailyStrategy: result.dailyStrategy,
            platformFocus: JSON.stringify(result.platformFocus),
            suggestedHooks: JSON.stringify(result.suggestedHooks),
            recommendedMix: JSON.stringify(result.recommendedMix),
            brandDNASnapshot: JSON.stringify(dna),
            isActive: true
          }
        });
        
        console.log(`✅ Content Strategy saved for user ${userId}`);
        
        // Return result with updated credit balance
        res.json({
          ...result,
          credits: balanceAfter,
          creditCost
        });
        
      } catch (generationError) {
        console.error('❌ Content Strategy generation failed, refunding credits:', generationError);
        
        // Refund credits if generation failed
        await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: { credits: balanceBefore }
          }),
          prisma.creditTransaction.create({
            data: {
              userId,
              amount: creditCost,
              action: 'refund_content_strategy',
              description: 'Refunded credits due to generation failure',
              balanceBefore: balanceAfter,
              balanceAfter: balanceBefore
            }
          })
        ]);
        
        throw generationError;
      }
    } else {
      // No userId provided, just generate without saving or credit deduction
      console.log('⚠️ No userId provided, generating without saving to database');
      const result = await geminiServer.generateContentStrategy(dna);
      res.json(result);
    }
    
  } catch (error) {
    console.error('❌ Content Strategy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Content Strategy for user
app.get('/api/content-strategy/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const strategy = await prisma.contentStrategy.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!strategy) {
      return res.status(404).json({ error: 'No Content Strategy found for user' });
    }
    
    res.json({
      strategy: {
        dailyStrategy: strategy.dailyStrategy,
        platformFocus: JSON.parse(strategy.platformFocus),
        suggestedHooks: JSON.parse(strategy.suggestedHooks),
        recommendedMix: JSON.parse(strategy.recommendedMix),
        createdAt: strategy.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate-post', async (req, res) => {
  try {
    const { platform, topic, dna, userId } = req.body;
    
    // Deduct credits if userId is provided
    if (userId) {
      const creditCost = 30; // Cost for content generation
      
      try {
        // Check if user has enough credits
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        if (user.credits < creditCost) {
          return res.status(400).json({ 
            error: 'Insufficient credits', 
            required: creditCost,
            available: user.credits 
          });
        }
        
        // Deduct credits
        const balanceBefore = user.credits;
        const balanceAfter = user.credits - creditCost;
        
        await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: { credits: balanceAfter }
          }),
          prisma.creditTransaction.create({
            data: {
              userId,
              amount: -creditCost,
              action: 'content_generation',
              description: `Generated ${platform} post for topic: ${topic}`,
              balanceBefore,
              balanceAfter
            }
          })
        ]);
        
        console.log(`Deducted ${creditCost} credits from user ${userId} for content generation. New balance: ${balanceAfter}`);
        
        // Try to generate post - if it fails, refund the credits
        try {
          const result = await geminiServer.generatePost(platform, topic, dna);
          return res.json({ content: result, credits: balanceAfter });
        } catch (generateError) {
          console.error('Content generation failed, refunding credits:', generateError);
          
          // Refund the credits
          await prisma.$transaction([
            prisma.user.update({
              where: { id: userId },
              data: { credits: balanceBefore }
            }),
            prisma.creditTransaction.create({
              data: {
                userId,
                amount: creditCost,
                action: 'refund_content_gen_failed',
                description: `Refund: Content generation failed - ${generateError.message}`,
                balanceBefore: balanceAfter,
                balanceAfter: balanceBefore
              }
            })
          ]);
          
          console.log(`Refunded ${creditCost} credits to user ${userId}. Balance restored to: ${balanceBefore}`);
          return res.status(500).json({ 
            error: generateError.message || 'Content generation failed',
            refunded: true,
            credits: balanceBefore
          });
        }
      } catch (creditError) {
        console.error('Credit deduction failed:', creditError);
        return res.status(500).json({ error: 'Failed to deduct credits' });
      }
    }
    
    const result = await geminiServer.generatePost(platform, topic, dna);
    res.json({ content: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate-image', async (req, res) => {
  try {
    const { topic, dna, userId } = req.body;
    
    // Check credits if userId is provided, but DON'T deduct yet
    if (userId) {
      const creditCost = 40; // Cost for image generation
      
      // Check if user has enough credits
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (user.credits < creditCost) {
        return res.status(400).json({ 
          error: 'Insufficient credits', 
          required: creditCost,
          available: user.credits 
        });
      }
      
      try {
        // FIRST: Try to generate the image
        console.log(`Attempting to generate image for user ${userId}...`);
        const result = await geminiServer.generateImage(topic, dna);
        
        // ONLY deduct credits if image generation succeeded
        const balanceBefore = user.credits;
        const balanceAfter = user.credits - creditCost;
        
        await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: { credits: balanceAfter }
          }),
          prisma.creditTransaction.create({
            data: {
              userId,
              amount: -creditCost,
              action: 'image_generation',
              description: `Generated image for topic: ${topic}`,
              balanceBefore,
              balanceAfter
            }
          })
        ]);
        
        console.log(`✅ Image generated successfully. Deducted ${creditCost} credits from user ${userId}. New balance: ${balanceAfter}`);
        return res.json({ imageUrl: result, credits: balanceAfter });
      } catch (imageError) {
        console.error('❌ Image generation failed, no credits deducted:', imageError);
        return res.status(500).json({ 
          error: imageError.message || 'Failed to generate image',
          creditsDeducted: false // Explicitly state no credits were taken
        });
      }
    }
    
    // No userId, generate without credit tracking
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
    
    // Deduct credits if userId is provided
    if (metadata?.userId) {
      const userId = metadata.userId;
      const creditCost = 30; // Cost for publishing content
      
      // Check if user has enough credits
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (user.credits < creditCost) {
        return res.status(400).json({ 
          error: 'Insufficient credits', 
          required: creditCost,
          available: user.credits 
        });
      }
      
      // Deduct credits first
      const balanceBefore = user.credits;
      const balanceAfter = user.credits - creditCost;
      
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { credits: balanceAfter }
        }),
        prisma.creditTransaction.create({
          data: {
            userId,
            amount: -creditCost,
            action: 'content_publish',
            description: `Published content to ${platform}`,
            balanceBefore,
            balanceAfter
          }
        })
      ]);
      
      console.log(`Deducted ${creditCost} credits from user ${userId}. New balance: ${balanceAfter}`);
      
      // Try to publish - if it fails, refund the credits
      try {
        const result = await geminiServer.publishToPlatform(platform, content, metadata);
        return res.json({ ...result, credits: balanceAfter });
      } catch (publishError) {
        console.error('Publishing failed, refunding credits:', publishError);
        
        // Refund the credits
        await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: { credits: balanceBefore }
          }),
          prisma.creditTransaction.create({
            data: {
              userId,
              amount: creditCost,
              action: 'refund_publish_failed',
              description: `Refund: Publishing to ${platform} failed - ${publishError.message}`,
              balanceBefore: balanceAfter,
              balanceAfter: balanceBefore
            }
          })
        ]);
        
        console.log(`Refunded ${creditCost} credits to user ${userId}. Balance restored to: ${balanceBefore}`);
        return res.status(500).json({ 
          error: publishError.message || 'Publishing failed',
          refunded: true,
          credits: balanceBefore
        });
      }
    }
    
    // No userId provided, publish without credits
    const result = await geminiServer.publishToPlatform(platform, content, metadata);
    res.json(result);
  } catch (error) {
    console.error('Publish error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/monetization-plan', async (req, res) => {
  try {
    const { dna, metrics, userId } = req.body;
    console.log('🔍 Monetization API called with userId:', userId, 'dna:', !!dna);
    
    // Deduct credits if userId is provided
    if (userId) {
      const creditCost = 30; // Cost for Monetization Plan generation
      
      // Check if user has enough credits
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (user.credits < creditCost) {
        return res.status(400).json({ 
          error: 'Insufficient credits', 
          required: creditCost,
          available: user.credits 
        });
      }
      
      // Deduct credits first
      const balanceBefore = user.credits;
      const balanceAfter = user.credits - creditCost;
      
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { credits: balanceAfter }
        }),
        prisma.creditTransaction.create({
          data: {
            userId,
            amount: -creditCost,
            action: 'monetization_plan',
            description: 'Generated Monetization Plan',
            balanceBefore,
            balanceAfter
          }
        })
      ]);
      
      console.log(`Deducted ${creditCost} credits from user ${userId} for Monetization Plan. New balance: ${balanceAfter}`);
      
      // Try to generate plan - if it fails, refund credits
      try {
        const result = await geminiServer.getMonetizationPlan(dna, metrics);
        console.log('✅ Monetization plan generated, ideas count:', result.length);
        
        // Save Monetization Plan to database
        await prisma.monetizationPlan.updateMany({
          where: { userId, isActive: true },
          data: { isActive: false }
        });
        
        await prisma.monetizationPlan.create({
          data: {
            userId,
            ideas: JSON.stringify(result),
            dnaSnapshot: JSON.stringify(dna),
            metricsSnapshot: JSON.stringify(metrics),
            isActive: true
          }
        });
        
        console.log('✅ Monetization Plan saved for user', userId);
        
        // Transform API response to UI-expected format
        const transformedPlans = result.map(plan => ({
          title: plan.idea_name || plan.title,
          description: plan.description,
          readiness: plan.readiness || 'Medium', // Default readiness
          estimatedRevenue: plan.estimatedRevenue || '$2K-5K/mo', // Default revenue estimate  
          type: plan.type
        }));
        
        // Return result with updated credit balance
        res.json({
          plans: transformedPlans,
          credits: balanceAfter,
          creditCost
        });
        
      } catch (generationError) {
        console.error('❌ Monetization generation failed, refunding credits:', generationError);
        
        // Refund credits if generation failed
        await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: { credits: balanceBefore }
          }),
          prisma.creditTransaction.create({
            data: {
              userId,
              amount: creditCost,
              action: 'refund_monetization_plan',
              description: 'Refunded credits due to generation failure',
              balanceBefore: balanceAfter,
              balanceAfter: balanceBefore
            }
          })
        ]);
        
        throw generationError;
      }
    } else {
      // No userId provided, just generate without saving or credit deduction
      console.log('⚠️ No userId provided, generating without saving to database');
      const result = await geminiServer.getMonetizationPlan(dna, metrics);
      console.log('✅ Monetization plan generated without user context');
      
      // Transform API response to UI-expected format
      const transformedPlans = result.map(plan => ({
        title: plan.idea_name || plan.title,
        description: plan.description,
        readiness: plan.readiness || 'Medium', // Default readiness
        estimatedRevenue: plan.estimatedRevenue || '$2K-5K/mo', // Default revenue estimate
        type: plan.type
      }));
      
      res.json(transformedPlans);
    }
    
  } catch (error) {
    console.error('❌ Monetization plan error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Monetization Plan for user
app.get('/api/monetization-plan/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('📥 GET monetization plan for userId:', userId);
    
    const plan = await prisma.monetizationPlan.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!plan) {
      console.log('❌ No Monetization Plan found for user:', userId);
      return res.status(404).json({ error: 'No Monetization Plan found for user' });
    }
    
    console.log('✅ Found monetization plan for user:', userId, 'created at:', plan.createdAt);
    
    // Transform API response to UI-expected format
    const rawPlans = JSON.parse(plan.ideas);
    const transformedPlans = rawPlans.map(plan => ({
      title: plan.idea_name || plan.title,
      description: plan.description,
      readiness: plan.readiness || 'Medium', // Default readiness
      estimatedRevenue: plan.estimatedRevenue || '$2K-5K/mo', // Default revenue estimate
      type: plan.type
    }));
    
    res.json({
      plans: transformedPlans,
      createdAt: plan.createdAt
    });
  } catch (error) {
    console.error('❌ GET monetization plan error:', error);
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

// Update post status
app.patch('/api/posts/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { 
      status, 
      publishedAt, 
      platformPostId, 
      platformResponse, 
      platformError,
      publishAttempts,
      lastPublishAttempt
    } = req.body;
    
    const updateData = { status };
    if (publishedAt) {
      updateData.publishedAt = new Date(publishedAt);
    }
    if (platformPostId !== undefined) {
      updateData.platformPostId = platformPostId;
    }
    if (platformResponse !== undefined) {
      updateData.platformResponse = platformResponse;
    }
    if (platformError !== undefined) {
      updateData.platformError = platformError;
    }
    if (publishAttempts !== undefined) {
      updateData.publishAttempts = publishAttempts;
    }
    if (lastPublishAttempt) {
      updateData.lastPublishAttempt = new Date(lastPublishAttempt);
    }
    
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: updateData,
      include: { user: true }
    });
    
    console.log(`Post ${postId} updated to status: ${status}`, { platformPostId, platformError: platformError?.substring(0, 100) });
    
    // Send email notification for published or failed posts
    if (updatedPost.user.email) {
      console.log(`📧 Attempting to send email to: ${updatedPost.user.email}`);
      try {
        if (status === 'published' && !platformError) {
          // Post published successfully
          console.log('📧 Sending post published email...');
          const result = await emailService.sendPostPublishedEmail(
            updatedPost.user.email,
            updatedPost.user.username,
            {
              platform: updatedPost.platform,
              content: updatedPost.content,
              platformPostId: platformPostId
            }
          );
          console.log('📧 Email result:', result);
        } else if (status === 'failed' && platformError) {
          // Post publishing failed
          console.log('📧 Sending post failed email...');
          const result = await emailService.sendPostFailedEmail(
            updatedPost.user.email,
            updatedPost.user.username,
            {
              platform: updatedPost.platform,
              scheduledFor: updatedPost.scheduledFor
            },
            platformError
          );
          console.log('📧 Email result:', result);
        }
      } catch (emailError) {
        console.error('❌ Failed to send email notification:', emailError.message);
        // Don't fail the request if email fails
      }
    } else {
      console.log('⚠️ No email address for user, skipping notification');
    }
    
    res.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
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

// Email logs endpoint for admin panel
app.get('/api/email-logs', async (req, res) => {
  try {
    const { limit = '50', status, type } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    
    const logs = await prisma.emailLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });
    
    // Get statistics
    const stats = await prisma.emailLog.groupBy({
      by: ['status'],
      _count: true
    });
    
    const totalSent = stats.find(s => s.status === 'sent')?._count || 0;
    const totalFailed = stats.find(s => s.status === 'failed')?._count || 0;
    
    res.json({
      logs,
      stats: {
        totalSent,
        totalFailed,
        total: totalSent + totalFailed,
        successRate: totalSent + totalFailed > 0 
          ? ((totalSent / (totalSent + totalFailed)) * 100).toFixed(2)
          : 0
      }
    });
  } catch (error) {
    console.error('Error fetching email logs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Credit management endpoints
app.get('/api/user/:userId/credits', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      select: { credits: true, maxCredits: true, plan: true }
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/user/credits/deduct', async (req, res) => {
  try {
    const { userId, amount, action, description } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.credits < amount) {
      return res.status(400).json({ error: 'Insufficient credits', credits: user.credits });
    }
    
    const balanceBefore = user.credits;
    const balanceAfter = user.credits - amount;
    
    // Update user credits and create transaction in a single transaction
    const [updatedUser, transaction] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { credits: balanceAfter }
      }),
      prisma.creditTransaction.create({
        data: {
          userId,
          amount: -amount,
          action,
          description: description || `Deducted ${amount} credits for ${action}`,
          balanceBefore,
          balanceAfter
        }
      })
    ]);
    
    // Also log in the old Log table for backwards compatibility
    await prisma.log.create({
      data: {
        userId,
        action: 'credit_deduction',
        details: JSON.stringify({ amount, action, remainingCredits: updatedUser.credits })
      }
    });
    
    // Send low credits warning if below 20%
    const creditPercentage = (balanceAfter / user.maxCredits) * 100;
    console.log(`💰 Credit check: ${balanceAfter}/${user.maxCredits} = ${creditPercentage.toFixed(2)}%`);
    
    if (creditPercentage <= 20 && creditPercentage > 0 && user.email) {
      console.log('⚠️ Credits below 20%! Sending warning email...');
      try {
        await emailService.sendCreditsLowEmail(
          user.email,
          user.username,
          {
            currentCredits: balanceAfter,
            maxCredits: user.maxCredits
          }
        );
        console.log('✅ Credits low email sent successfully');
      } catch (emailError) {
        console.error('❌ Failed to send credits low email:', emailError.message);
        // Don't fail the request if email fails
      }
    } else if (creditPercentage <= 20 && !user.email) {
      console.log('⚠️ Credits below 20% but user has no email address');
    }
    
    res.json({ 
      success: true, 
      credits: updatedUser.credits,
      transaction: {
        id: transaction.id,
        balanceBefore,
        balanceAfter
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/user/:userId/post-count', async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const count = await prisma.post.count({
      where: {
        userId: req.params.userId,
        createdAt: { gte: startOfMonth }
      }
    });
    
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/user/upgrade-plan', async (req, res) => {
  try {
    const { userId, newPlan, stripeCustomerId, stripeSubscriptionId } = req.body;
    
    console.log('Upgrade plan request:', { userId, newPlan });
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    if (!newPlan) {
      return res.status(400).json({ error: 'newPlan is required' });
    }
    
    const planCredits = {
      free: 1000,
      pro: 10000,
      business: 50000,
      enterprise: 999999
    };
    
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    
    // Update user and create subscription record
    const [updatedUser, subscription] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          plan: newPlan,
          maxCredits: planCredits[newPlan] || 1000,
          credits: planCredits[newPlan] || 1000,
          creditsResetAt: now
        }
      }),
      prisma.subscription.create({
        data: {
          userId,
          plan: newPlan,
          status: 'active',
          stripeCustomerId: stripeCustomerId || null,
          stripeSubscriptionId: stripeSubscriptionId || null,
          currentPeriodStart: now,
          currentPeriodEnd: nextMonth
        }
      })
    ]);
    
    console.log('User updated:', { id: updatedUser.id, plan: updatedUser.plan, credits: updatedUser.credits });
    
    // Log credit reset
    await prisma.creditTransaction.create({
      data: {
        userId,
        amount: planCredits[newPlan] || 1000,
        action: 'plan_upgrade',
        description: `Upgraded to ${newPlan} plan - credits reset to ${planCredits[newPlan]}`,
        balanceBefore: 0,
        balanceAfter: planCredits[newPlan] || 1000
      }
    });
    
    res.json({ success: true, user: updatedUser, subscription });
  } catch (error) {
    console.error('Upgrade plan error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get credit transaction history
app.get('/api/user/:userId/credit-history', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const [transactions, total] = await Promise.all([
      prisma.creditTransaction.findMany({
        where: { userId: req.params.userId },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.creditTransaction.count({
        where: { userId: req.params.userId }
      })
    ]);
    
    res.json({ transactions, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user details by ID (for verification)
app.get('/api/user/:userId', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      select: {
        id: true,
        username: true,
        role: true,
        plan: true,
        credits: true,
        maxCredits: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get subscription info
app.get('/api/user/:userId/subscription', async (req, res) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { 
        userId: req.params.userId,
        status: 'active'
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ subscription });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel subscription
app.post('/api/user/subscription/cancel', async (req, res) => {
  try {
    const { userId, subscriptionId } = req.body;
    
    const subscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { 
        status: 'cancelled',
        cancelAtPeriodEnd: true
      }
    });
    
    res.json({ success: true, subscription });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== HyperPay Payment Integration =====

// Create payment checkout
app.post('/api/payment/checkout', async (req, res) => {
  try {
    const { plan, billingCycle, amount, currency, userEmail } = req.body;
    
    console.log('Creating HyperPay checkout:', { plan, billingCycle, amount, currency, userEmail });
    
    if (!plan || !billingCycle || !amount || !userEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get HyperPay service
    const service = await getHyperPayService();
    if (!service) {
      return res.status(503).json({ error: 'Payment service not configured. Please configure HyperPay settings.' });
    }
    
    // Get user ID from email
    const user = await prisma.user.findFirst({
      where: { username: userEmail }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if there's already a pending payment for this user and plan
    const existingPendingPayment = await prisma.paymentTransaction.findFirst({
      where: {
        userId: user.id,
        plan: plan,
        status: 'pending',
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Within last 5 minutes
        }
      }
    });
    
    if (existingPendingPayment) {
      console.log('Found existing pending payment, returning existing checkout');
      // Return existing checkout instead of creating a new one
      return res.json({
        success: true,
        checkoutId: existingPendingPayment.checkoutId,
        amount,
        scriptUrl: service.getWidgetScriptUrl(),
        brands: service.config.brands
      });
    }
    
    // Create checkout with HyperPay
    const checkout = await service.createCheckout(
      amount,
      currency,
      userEmail,
      plan,
      user.id
    );
    
    console.log('HyperPay checkout created:', checkout.id);
    
    // Store pending payment in database
    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        plan,
        status: 'pending',
        stripeCustomerId: checkout.id, // Reusing this field for HyperPay checkout ID
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + (billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000)
      }
    });
    
    // Create payment transaction record
    await prisma.paymentTransaction.create({
      data: {
        userId: user.id,
        checkoutId: checkout.id,
        plan: plan,
        billingCycle: billingCycle,
        amount: amount,
        currency: currency || 'SAR',
        status: 'pending'
      }
    });
    
    console.log('Subscription and payment transaction created');
    
    res.json({ 
      success: true,
      checkoutId: checkout.id,
      amount,
      scriptUrl: service.getWidgetScriptUrl(),
      brands: service.getSupportedBrands()
    });
  } catch (error) {
    console.error('Payment checkout error:', error);
    
    // Send user-friendly error message
    const errorMessage = error.message || 'Failed to create payment checkout. Please try again.';
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get payment history for user
app.get('/api/payment/history', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const session = await prisma.session.findUnique({ 
      where: { token },
      include: { user: true }
    });
    
    if (!session) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    const transactions = await prisma.paymentTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50 // Last 50 transactions
    });
    
    res.json({ success: true, transactions });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify payment status
app.get('/api/payment/verify/:checkoutId', async (req, res) => {
  const { checkoutId } = req.params; // Define outside try block
  
  try {
    console.log('Verifying payment:', checkoutId);
    
    const service = await getHyperPayService();
    if (!service) {
      return res.status(503).json({ error: 'Payment service not configured' });
    }
    
    // Check if payment was already verified
    const existingTransaction = await prisma.paymentTransaction.findUnique({
      where: { checkoutId: checkoutId }
    });
    
    if (existingTransaction && existingTransaction.status === 'success') {
      // Payment already verified, return success
      const user = await prisma.user.findUnique({
        where: { id: existingTransaction.userId }
      });
      return res.json({
        success: true,
        message: `Already verified - you're on ${user.plan.toUpperCase()} plan!`,
        user: {
          id: user.id,
          plan: user.plan,
          credits: user.credits,
          maxCredits: user.maxCredits
        }
      });
    }
    
    const paymentStatus = await service.getPaymentStatus(checkoutId);
    const isSuccessful = service.isPaymentSuccessful(paymentStatus.result.code);
    
    console.log('Payment status:', { 
      checkoutId, 
      code: paymentStatus.result.code, 
      isSuccessful 
    });
    
    if (isSuccessful) {
      // Find the pending subscription
      const subscription = await prisma.subscription.findFirst({
        where: { 
          stripeCustomerId: checkoutId,
          status: 'pending'
        },
        include: { user: true }
      });
      
      if (subscription) {
        const planCredits = {
          free: 1000,
          pro: 10000,
          business: 50000,
          enterprise: 999999
        };
        
        // Upgrade user plan
        const [updatedUser, updatedSubscription, updatedTransaction, creditLog] = await prisma.$transaction([
          prisma.user.update({
            where: { id: subscription.userId },
            data: {
              plan: subscription.plan,
              maxCredits: planCredits[subscription.plan] || 1000,
              credits: planCredits[subscription.plan] || 1000,
              creditsResetAt: new Date()
            }
          }),
          prisma.subscription.update({
            where: { id: subscription.id },
            data: { 
              status: 'active',
              stripeSubscriptionId: paymentStatus.id,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            }
          }),
          prisma.paymentTransaction.update({
            where: { checkoutId: checkoutId },
            data: {
              status: 'success',
              paymentId: paymentStatus.id,
              paymentMethod: paymentStatus.paymentBrand,
              resultCode: paymentStatus.result.code,
              resultDescription: paymentStatus.result.description
            }
          }),
          prisma.creditTransaction.create({
            data: {
              userId: subscription.userId,
              amount: planCredits[subscription.plan] || 1000,
              action: 'plan_upgrade',
              description: `Upgraded to ${subscription.plan} plan via HyperPay - credits reset to ${planCredits[subscription.plan]}`,
              balanceBefore: 0,
              balanceAfter: planCredits[subscription.plan] || 1000
            }
          })
        ]);
        
        console.log('Plan upgraded successfully:', { 
          userId: updatedUser.id, 
          plan: updatedUser.plan 
        });
        
        // Send payment confirmation email
        if (subscription.user.email) {
          const paymentTransaction = await prisma.paymentTransaction.findUnique({
            where: { checkoutId: checkoutId }
          });
          
          await emailService.sendPaymentConfirmedEmail(
            subscription.user.email,
            subscription.user.username,
            {
              amount: paymentTransaction.amount,
              currency: paymentTransaction.currency,
              plan: subscription.plan,
              billingCycle: paymentTransaction.billingCycle,
              credits: planCredits[subscription.plan] || 1000,
              checkoutId: checkoutId
            }
          );
          
          // Also send plan upgraded email
          await emailService.sendPlanUpgradedEmail(
            subscription.user.email,
            subscription.user.username,
            {
              oldPlan: subscription.user.plan,
              newPlan: subscription.plan,
              credits: planCredits[subscription.plan] || 1000,
              maxCredits: planCredits[subscription.plan] || 1000
            }
          );
        }
        
        res.json({ 
          success: true, 
          message: `Successfully upgraded to ${subscription.plan.toUpperCase()} plan!`,
          user: updatedUser,
          subscription: updatedSubscription,
          transaction: updatedTransaction
        });
      } else {
        res.json({ success: false, error: 'Subscription not found' });
      }
    } else {
      // Payment failed - get subscription for user details
      const subscription = await prisma.subscription.findFirst({
        where: { 
          stripeCustomerId: checkoutId,
          status: 'pending'
        },
        include: { user: true }
      });
      
      // Update subscription and transaction to failed
      await prisma.$transaction([
        prisma.subscription.updateMany({
          where: { 
            stripeCustomerId: checkoutId,
            status: 'pending'
          },
          data: { status: 'failed' }
        }),
        prisma.paymentTransaction.update({
          where: { checkoutId: checkoutId },
          data: {
            status: 'failed',
            resultCode: paymentStatus.result.code,
            resultDescription: paymentStatus.result.description
          }
        })
      ]);
      
      // Send payment failed email
      if (subscription?.user?.email) {
        const paymentTransaction = await prisma.paymentTransaction.findUnique({
          where: { checkoutId: checkoutId }
        });
        
        await emailService.sendPaymentFailedEmail(
          subscription.user.email,
          subscription.user.username,
          {
            amount: paymentTransaction.amount,
            currency: paymentTransaction.currency,
            plan: subscription.plan
          },
          paymentStatus.result.description
        );
      }
      
      res.json({ 
        success: false, 
        message: 'Payment failed. Please try again.',
        error: paymentStatus.result.description 
      });
    }
  } catch (error) {
    // Check if it's a session expired error
    const errorMessage = error.message || '';
    const isSessionExpired = errorMessage.includes('No payment session found') || 
                             errorMessage.includes('session expired') || 
                             errorMessage.includes('30min ago');
    
    if (isSessionExpired) {
      // Don't log expired sessions as errors - they're expected
      console.log('Payment session expired or not found:', checkoutId);
      return res.status(400).json({ 
        success: false, 
        error: 'Payment session expired or not found. This is normal for old payment links.',
        sessionExpired: true
      });
    }
    
    // Log actual errors
    console.error('Payment verification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook endpoint for async payment notifications
app.post('/api/webhooks/hyperpay', async (req, res) => {
  try {
    // HyperPay sends payment result as query params
    const { id: checkoutId, resourcePath } = req.query;
    
    console.log('HyperPay webhook received:', { checkoutId, resourcePath });
    
    if (!checkoutId) {
      return res.status(400).json({ error: 'Missing checkout ID' });
    }
    
    const service = await getHyperPayService();
    if (!service) {
      console.error('Payment service not configured for webhook');
      return res.json({ success: false, error: 'Service not configured' });
    }
    
    // Verify payment status
    const paymentStatus = await service.getPaymentStatus(checkoutId);
    const isSuccessful = service.isPaymentSuccessful(paymentStatus.result.code);
    
    console.log('Webhook payment status:', { 
      checkoutId, 
      code: paymentStatus.result.code, 
      isSuccessful 
    });
    
    if (isSuccessful) {
      // Process payment (same logic as verify endpoint)
      const subscription = await prisma.subscription.findFirst({
        where: { 
          stripeCustomerId: checkoutId,
          status: 'pending'
        }
      });
      
      if (subscription) {
        const planCredits = {
          free: 1000,
          pro: 10000,
          business: 50000,
          enterprise: 999999
        };
        
        await prisma.$transaction([
          prisma.user.update({
            where: { id: subscription.userId },
            data: {
              plan: subscription.plan,
              maxCredits: planCredits[subscription.plan] || 1000,
              credits: planCredits[subscription.plan] || 1000,
              creditsResetAt: new Date()
            }
          }),
          prisma.subscription.update({
            where: { id: subscription.id },
            data: { 
              status: 'active',
              stripeSubscriptionId: paymentStatus.id
            }
          }),
          prisma.creditTransaction.create({
            data: {
              userId: subscription.userId,
              amount: planCredits[subscription.plan] || 1000,
              action: 'plan_upgrade',
              description: `Upgraded to ${subscription.plan} plan via HyperPay webhook`,
              balanceBefore: 0,
              balanceAfter: planCredits[subscription.plan] || 1000
            }
          })
        ]);
        
        console.log('Webhook: Plan upgraded successfully');
      }
    }
    
    // Always return 200 to acknowledge webhook
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    // Still return 200 to prevent retries
    res.json({ success: false, error: error.message });
  }
});

// Analytics endpoint
app.get('/api/analytics/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('Analytics endpoint called for userId:', userId);
    
    // Get all published posts for the user
    const posts = await prisma.post.findMany({
      where: {
        userId,
        status: 'published'
      },
      select: {
        content: true,
        platform: true,
        views: true,
        likes: true,
        shares: true,
        comments: true,
        engagement: true,
        category: true
      }
    });
    
    console.log(`Found ${posts.length} published posts for user ${userId}`);

    // Calculate total stats
    const totalStats = {
      views: posts.reduce((sum, p) => sum + p.views, 0),
      likes: posts.reduce((sum, p) => sum + p.likes, 0),
      shares: posts.reduce((sum, p) => sum + p.shares, 0),
      comments: posts.reduce((sum, p) => sum + p.comments, 0),
      posts: posts.length
    };

    // Group by category
    const categoryMap = {};
    posts.forEach(post => {
      const cat = post.category || 'Uncategorized';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { totalEngagement: 0, count: 0, likes: 0, shares: 0 };
      }
      categoryMap[cat].totalEngagement += post.engagement;
      categoryMap[cat].count += 1;
      categoryMap[cat].likes += post.likes;
      categoryMap[cat].shares += post.shares;
    });

    const categoryStats = Object.entries(categoryMap)
      .map(([name, data]) => ({
        name,
        engagement: Math.round(data.totalEngagement / data.count) || 0,
        posts: data.count,
        color: data.totalEngagement / data.count > 50 ? '#10b981' : 
               data.totalEngagement / data.count > 30 ? '#6366f1' : 
               data.totalEngagement / data.count > 10 ? '#f59e0b' : '#ef4444'
      }))
      .sort((a, b) => b.engagement - a.engagement);

    // Group by platform
    const platformMap = {};
    posts.forEach(post => {
      if (!platformMap[post.platform]) {
        platformMap[post.platform] = { totalEngagement: 0, count: 0 };
      }
      platformMap[post.platform].totalEngagement += post.engagement;
      platformMap[post.platform].count += 1;
    });

    const platformStats = Object.entries(platformMap).map(([platform, data]) => ({
      platform,
      engagement: Math.round(data.totalEngagement / data.count) || 0,
      posts: data.count
    }));

    // Find top performing post
    const topPost = posts.length > 0 
      ? posts.reduce((max, post) => post.engagement > (max?.engagement || 0) ? post : max, null)
      : null;

    // Generate AI insights
    const avgEngagement = posts.length > 0 
      ? posts.reduce((sum, p) => sum + p.engagement, 0) / posts.length 
      : 0;
    
    const topCategory = categoryStats[0];
    const worstCategory = categoryStats[categoryStats.length - 1];
    
    const insights = {
      worked: posts.length === 0 
        ? 'Publish your first posts to get insights on what works for your audience.'
        : topCategory
          ? `${topCategory.name} content performs best with ${topCategory.engagement}% avg engagement. ${topCategory.posts > 1 ? 'Keep creating similar content!' : 'Create more posts in this category.'}`
          : 'Your content is performing consistently across categories.',
      failed: posts.length < 3
        ? 'Need more data to identify patterns. Keep publishing!'
        : worstCategory && worstCategory.engagement < avgEngagement * 0.5
          ? `${worstCategory.name} posts underperform at ${worstCategory.engagement}% engagement. Consider refreshing your approach or testing different angles.`
          : 'All content categories are performing well. Focus on volume and consistency.',
      recommendation: posts.length === 0
        ? 'Start with Instagram at 8 AM EST for maximum visibility with your target audience.'
        : platformStats.length > 0
          ? `${platformStats[0].platform} shows strongest engagement (${platformStats[0].engagement}%). ${platformStats.length > 1 ? `Cross-post to ${platformStats[1].platform} 4 hours later for maximum reach.` : 'Expand to other platforms to diversify your reach.'}`
          : 'Post consistently across multiple platforms to build your audience.'
    };

    res.json({
      categoryStats,
      totalStats,
      platformStats,
      topPost: topPost ? {
        content: topPost.content.slice(0, 200),
        engagement: Math.round(topPost.engagement),
        platform: topPost.platform
      } : null,
      insights
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API Statistics endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const avgLatency = apiStats.totalRequests > 0 
      ? Math.round(apiStats.totalLatency / apiStats.totalRequests) 
      : 0;
    
    const successRate = apiStats.totalRequests > 0
      ? ((apiStats.successfulRequests / apiStats.totalRequests) * 100).toFixed(1)
      : 100;
    
    // Get connection count from config
    const configs = await prisma.config.findMany({
      where: {
        key: { in: ['TWITTER_API_KEY', 'FACEBOOK_ACCESS_TOKEN', 'INSTAGRAM_ACCESS_TOKEN'] }
      }
    });
    
    const connectedPlatforms = configs.filter(c => c.value && c.value.length > 0).length;
    
    res.json({
      totalRequests: apiStats.requestsLast24h,
      avgLatency: `${avgLatency}ms`,
      successRate: `${successRate}%`,
      encryption: 'AES-256',
      connectedPlatforms,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// User Profile endpoints
app.get('/api/user/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        avatarStyle: true,
        createdAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get post stats
    const posts = await prisma.post.findMany({
      where: { userId }
    });
    
    const totalPosts = posts.length;
    const publishedPosts = posts.filter(p => p.status === 'published').length;
    
    // Get total credits used
    const transactions = await prisma.creditTransaction.findMany({
      where: { userId, amount: { lt: 0 } }
    });
    
    const totalCreditsUsed = Math.abs(
      transactions.reduce((sum, tx) => sum + tx.amount, 0)
    );
    
    res.json({
      ...user,
      totalPosts,
      publishedPosts,
      totalCreditsUsed,
      accountCreated: user.createdAt
    });
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/user/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, email, avatarStyle, currentPassword, newPassword } = req.body;
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password required' });
      }
      
      // Simple password check (in production, use bcrypt)
      if (user.passwordHash !== currentPassword) {
        return res.status(401).json({ error: 'Current password incorrect' });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
    }
    
    // Check if username is taken (if changing)
    if (username && username !== user.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username }
      });
      
      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }
    
    // Update user
    const updateData = {};
    if (username) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (avatarStyle) updateData.avatarStyle = avatarStyle;
    if (newPassword) updateData.passwordHash = newPassword;
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        plan: true,
        credits: true,
        maxCredits: true,
        avatarStyle: true
      }
    });
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
