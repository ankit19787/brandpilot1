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
        maxCredits: session.user.maxCredits
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
  try {
    const { checkoutId } = req.params;
    
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
      
      res.json({ 
        success: false, 
        message: 'Payment failed. Please try again.',
        error: paymentStatus.result.description 
      });
    }
  } catch (error) {
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
