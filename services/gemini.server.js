// Server-side only version of gemini service
// This file should only be imported by server.js, never by frontend components

import { GoogleGenAI, Type } from "@google/genai";
import { uploadToCloudinary } from "./cloudinaryUpload.js";
import { PrismaClient } from '@prisma/client';
import FormData from 'form-data';
import emailService from './emailService.js';

const prisma = new PrismaClient();

// Normalize platform names for consistency
function normalizePlatform(platform) {
  if (!platform) return 'Unknown';
  const normalized = platform.toLowerCase().trim();
  if (normalized.includes('twitter') || normalized === 'x' || normalized.includes('x (')) {
    return 'X (Twitter)';
  }
  if (normalized === 'facebook') {
    return 'Facebook';
  }
  if (normalized === 'instagram') {
    return 'Instagram';
  }
  if (normalized === 'linkedin') {
    return 'LinkedIn';
  }
  // Capitalize first letter for any other platforms
  return platform.charAt(0).toUpperCase() + platform.slice(1).toLowerCase();
}

// Helper to fetch config value from DB
async function getConfigValue(key) {
  const config = await prisma.config.findUnique({ where: { key } });
  return config?.value || "";
}

// Configurable caption length for Instagram (can be changed per client or .env)
export async function getInstagramCaptionLength() {
  const val = await getConfigValue('instagram_caption_length');
  return Number(val) || 300;
}

// Helper to get all credentials at once
async function getAllCredentials() {
  const configs = await prisma.config.findMany();
  return Object.fromEntries(configs.map((c) => [c.key, c.value]));
}

// Helper to get Gemini API key
async function getGeminiApiKey() {
  return await getConfigValue('gemini_api_key');
}

// Helper to get platform API URLs and versions
async function getPlatformConfig() {
  return {
    twitterApiUrl: await getConfigValue('twitter_api_url'),
    instagramApiUrl: await getConfigValue('instagram_api_url'),
    facebookApiUrl: await getConfigValue('facebook_api_url'),
    facebookApiVersion: await getConfigValue('facebook_api_version'),
    backendApiUrl: await getConfigValue('backend_api_url'),
  };
}

export const analyzeBrandDNA = async (pastPosts) => {
  try {
    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
      throw new Error("Gemini API key is not configured in the database.");
    }
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analyze these social media posts for Brand DNA: ${pastPosts}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            voice: { type: Type.STRING },
            personality: { type: Type.ARRAY, items: { type: Type.STRING } },
            contentPillars: { type: Type.ARRAY, items: { type: Type.STRING } },
            audienceType: { type: Type.STRING },
            writingStyle: { type: Type.STRING },
          },
          required: ["voice", "personality", "contentPillars", "audienceType", "writingStyle"],
        },
      },
    });
    if (!response.text) {
      console.error("Gemini API response:", response);
      throw new Error("Empty response from Brand DNA analysis model.");
    }
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Brand DNA analysis error:", error);
    if (error.response) {
      console.error("Gemini API error response:", error.response);
    }
    throw new Error(`Brand DNA synthesis failed: ${error.message}`);
  }
};

export const generateContentStrategy = async (dna) => {
  try {
    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
      throw new Error("Gemini API key is not configured in the database.");
    }
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Create a 7-day strategy for: ${JSON.stringify(dna)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dailyStrategy: { type: Type.STRING },
            platformFocus: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedHooks: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedMix: {
              type: Type.OBJECT,
              properties: {
                storytelling: { type: Type.NUMBER },
                authority: { type: Type.NUMBER },
                cta: { type: Type.NUMBER },
              },
            },
          },
          required: ["dailyStrategy", "platformFocus", "suggestedHooks", "recommendedMix"],
        },
      },
    });
    if (!response.text) {
      console.error("Gemini API response:", response);
      throw new Error("Empty response from strategy generation model.");
    }
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Content strategy error:", error);
    if (error.response) {
      console.error("Gemini API error response:", error.response);
    }
    throw new Error(`Strategy synthesis failed: ${error.message}`);
  }
};

export const generatePost = async (platform, topic, dna) => {
  try {
    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
      throw new Error("Gemini API key is not configured in the database.");
    }
    const ai = new GoogleGenAI({ apiKey });
    const captionLength = await getInstagramCaptionLength();
    let prompt = `Generate a ${platform} post about "${topic}". DNA: ${JSON.stringify(dna)}\nLimit the post/caption to ${captionLength} characters or less.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    if (!response.text) {
      console.error("Gemini API response:", response);
      throw new Error("AI synthesis failed: Empty response from model. Check API quota and credentials.");
    }
    return response.text;
  } catch (error) {
    console.error("Post generation error:", error);
    if (error.response) {
      console.error("Gemini API error response:", error.response);
    }
    throw new Error(`Post generation failed: ${error.message}`);
  }
};

export const generateImage = async (topic, dna) => {
  try {
    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
      throw new Error("Gemini API key is not configured in the database.");
    }
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `Professional cinematic visual for: ${topic}. Tone: ${dna.voice}.` }] },
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (part?.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    console.error("Gemini API response:", response);
    throw new Error("No image generated from model response.");
  } catch (error) {
    console.error("Image generation error:", error);
    if (error.response) {
      console.error("Gemini API error response:", error.response);
    }
    throw new Error(`Image generation failed: ${error.message}`);
  }
};

export async function fetchFacebookTokenFromBackend() {
  const { backendApiUrl } = await getPlatformConfig();
  const baseUrl = backendApiUrl || 'http://localhost:3001';
  const res = await fetch(`${baseUrl}/api/token/facebook`);
  const data = await res.json();
  if (!res.ok || !data.token) {
    throw new Error(data.error || 'Failed to fetch Facebook token from backend');
  }
  return data.token;
}

export async function refreshFacebookToken(longLivedToken) {
  const appId = await getConfigValue('facebook_app_id');
  const appSecret = await getConfigValue('facebook_app_secret');
  const { facebookApiUrl, facebookApiVersion } = await getPlatformConfig();
  const url = `${facebookApiUrl}/${facebookApiVersion}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${longLivedToken}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error?.message || "Failed to refresh Facebook token");
  }
  return data.access_token;
}

export async function ensureLongLivedFacebookToken(token) {
  if (token.length < 120) {
    const appId = await getConfigValue('facebook_app_id');
    const appSecret = await getConfigValue('facebook_app_secret');
    const { facebookApiUrl, facebookApiVersion } = await getPlatformConfig();
    const url = `${facebookApiUrl}/${facebookApiVersion}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${token}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || !data.access_token) {
      throw new Error(data.error?.message || "Failed to get long-lived Facebook token");
    }
    console.warn('[ACTION REQUIRED] New Facebook long-lived token generated. Please update VITE_FACEBOOK_PRODUCTION_TOKEN in your Vercel dashboard:', data.access_token);
    return data.access_token;
  }
  return token;
}

export async function publishToPlatform(platform, content, metadata) {
  const creds = await getAllCredentials();
  const platformConfig = await getPlatformConfig();
  
  let publishResult = {
    success: false,
    platformPostId: null,
    platformResponse: null,
    platformError: null,
    status: 500
  };
  
  try {
    // Handle Twitter/X
    if (platform === 'X (Twitter)' || platform === 'Twitter' || platform.toLowerCase().includes('twitter') || platform.toLowerCase().includes('x (')) {
      console.log('[publishToPlatform] Handling Twitter/X post');
      console.log('[publishToPlatform] Content:', content);
      
      if (!creds.x_api_key || !creds.x_api_secret || !creds.x_access_token || !creds.x_access_secret) {
        throw new Error('Twitter credentials not configured in database');
      }

      console.log('[publishToPlatform] Credentials found:', {
        apiKey: creds.x_api_key?.substring(0, 10) + '...',
        accessToken: creds.x_access_token?.substring(0, 10) + '...'
      });

      const twitterApiUrl = platformConfig.twitterApiUrl || 'https://api.twitter.com';
      const url = `${twitterApiUrl}/2/tweets`;
      console.log('[publishToPlatform] Twitter API URL:', url);

      // Generate OAuth 1.0a signature (server-side)
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
      console.log('[publishToPlatform] Auth header:', authHeader.substring(0, 150) + '...');

      // Post to Twitter
      console.log('[publishToPlatform] Sending request to Twitter...');
      const twitterRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: content })
      });

      console.log('[publishToPlatform] Response status:', twitterRes.status);
      const data = await twitterRes.json();
      console.log('[publishToPlatform] Response data:', JSON.stringify(data, null, 2));
      
      publishResult.platformResponse = JSON.stringify(data);
      publishResult.status = twitterRes.status;
      
      if (!twitterRes.ok) {
        const errorMessage = data.detail || data.title || data.error?.message || `Twitter API Error: ${twitterRes.status}`;
        publishResult.platformError = errorMessage;
        console.error('Twitter API Error:', data);
        throw new Error(errorMessage);
      }

      console.log('[publishToPlatform] Twitter post successful:', data.data?.id);
      publishResult.success = true;
      publishResult.platformPostId = data.data?.id;
      return { 
        status: 201, 
        id: data.data.id, 
        url: `https://x.com/i/web/status/${data.data.id}`,
        platformResponse: publishResult 
      };
    }
    
    if (platform === 'Instagram' || platform === 'Facebook') {
      const isInstagram = platform === 'Instagram';
      let token;
      
      try {
        if (isInstagram) {
          token = creds['instagram_token'];
          if (!token) {
            throw new Error("Instagram access token is not configured in database. Please set 'instagram_token' in Credentials.");
          }
        } else {
          token = await fetchFacebookTokenFromBackend();
          if (!token) {
            throw new Error("Facebook access token is not configured in database. Please set 'facebook_token' in Credentials.");
          }
        }
        const id = isInstagram ? creds['instagram_business_id'] : creds['facebook_page_id'];
        if (!id) {
          throw new Error(`${platform} business/page ID is not configured in database.`);
        }
        const apiUrl = isInstagram ? platformConfig.instagramApiUrl : platformConfig.facebookApiUrl;
        const apiVersion = platformConfig.facebookApiVersion;
        
        if (!apiUrl || !apiVersion) {
          throw new Error(`${platform} API configuration is missing in database.`);
        }

        let imageUrl = metadata?.imageUrl;
        
        if (imageUrl && imageUrl.startsWith('data:')) {
          imageUrl = await uploadToCloudinary(imageUrl);
        }

        const captionLength = await getInstagramCaptionLength();
        const caption = content.length > captionLength ? content.slice(0, captionLength) : content;

        if (isInstagram) {
          if (!imageUrl) {
            publishResult.platformError = "Instagram posts require an image URL.";
            throw new Error("Instagram posts require an image URL.");
          }
          
          // Step 1: Create media container
          const params1 = new URLSearchParams({
            image_url: imageUrl,
            caption: caption,
            access_token: token
          });
          
          const res1 = await fetch(`${apiUrl}/${apiVersion}/${id}/media`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params1.toString()
          });
          const data1 = await res1.json();
          publishResult.platformResponse = JSON.stringify({ step1: data1 });
          publishResult.status = res1.status;
          
          if (!res1.ok || !data1.id) {
            const errorMessage = data1.error?.message || "Instagram Media Container Error";
            publishResult.platformError = errorMessage;
            throw new Error(errorMessage);
          }
          
          // Step 2: Publish the media
          const params2 = new URLSearchParams({
            creation_id: data1.id,
            access_token: token
          });
          
          const res2 = await fetch(`${apiUrl}/${apiVersion}/${id}/media_publish`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params2.toString()
          });
          const data2 = await res2.json();
          publishResult.platformResponse = JSON.stringify({ step1: data1, step2: data2 });
          publishResult.status = res2.status;
          
          if (!res2.ok) {
            const errorMessage = data2.error?.message || "Instagram Publish Error";
            publishResult.platformError = errorMessage;
            throw new Error(errorMessage);
          }
          
          publishResult.success = true;
          publishResult.platformPostId = data2.id;
          return { 
            status: 201, 
            id: data2.id, 
            url: `https://instagram.com/p/${data2.id}`,
            platformResponse: publishResult 
          };
        } else {
          // Facebook posting
          if (imageUrl) {
            // Facebook photo post
            const params = new URLSearchParams({
              url: imageUrl,
              caption: caption,
              access_token: token
            });
            
            const res = await fetch(`${apiUrl}/${apiVersion}/${id}/photos`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              body: params.toString()
            });
            const data = await res.json();
            publishResult.platformResponse = JSON.stringify(data);
            publishResult.status = res.status;
            
            if (!res.ok) {
              const errorMessage = data.error?.message || "Facebook Photo Error";
              publishResult.platformError = errorMessage;
              throw new Error(errorMessage);
            }
            
            publishResult.success = true;
            publishResult.platformPostId = data.id;
            return { 
              status: 201, 
              id: data.id, 
              url: `https://facebook.com/${data.id}`,
              platformResponse: publishResult 
            };
          } else {
            // Facebook text post
            const params = new URLSearchParams({
              message: caption,
              access_token: token
            });
            
            const res = await fetch(`${apiUrl}/${apiVersion}/${id}/feed`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              body: params.toString()
            });
            const data = await res.json();
            publishResult.platformResponse = JSON.stringify(data);
            publishResult.status = res.status;
            
            if (!res.ok) {
              const errorMessage = data.error?.message || "Facebook Error";
              publishResult.platformError = errorMessage;
              throw new Error(errorMessage);
            }
            
            publishResult.success = true;
            publishResult.platformPostId = data.id;
            return { 
              status: 201, 
              id: data.id, 
              url: `https://facebook.com/${data.id}`,
              platformResponse: publishResult 
            };
          }
        }
      } catch (error) {
        if (!publishResult.platformError) {
          publishResult.platformError = error.message;
        }
        throw error;
      }
    }
    
    // Default mock response for other platforms
    publishResult.success = true;
    publishResult.platformPostId = "mock_" + Date.now();
    return { 
      status: 201, 
      id: "mock_" + Date.now(), 
      url: "#",
      platformResponse: publishResult 
    };
    
  } catch (error) {
    if (!publishResult.platformError) {
      publishResult.platformError = error.message;
    }
    throw error;
  }
}

export const getMonetizationPlan = async (dna, metrics) => {
  try {
    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
      throw new Error("Gemini API key is not configured in the database.");
    }
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Monetization ideas for: ${JSON.stringify(dna)}`,
      config: { responseMimeType: "application/json" },
    });
    if (!response.text) {
      console.error("Gemini API response:", response);
      throw new Error("Empty response from monetization plan model.");
    }
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Monetization plan error:", error);
    if (error.response) {
      console.error("Gemini API error response:", error.response);
    }
    throw new Error(`Monetization synthesis failed: ${error.message}`);
  }
};

export async function createPost({ userId, platform, content, imageUrl, status, scheduledFor }) {
  console.log('🔍 createPost called with userId:', userId, '| platform:', platform);
  try {
    // Normalize platform name for consistency
    const normalizedPlatform = normalizePlatform(platform);
    console.log('📝 Normalized platform:', platform, '→', normalizedPlatform);
    
    // Validate userId is provided and looks like a UUID
    if (!userId || userId === 'default_user') {
      console.error('❌ INVALID userId provided to createPost:', userId);
      console.error('Posts must be created with a valid authenticated user ID!');
      throw new Error('User ID is required to create posts. Please ensure you are logged in.');
    }
    
    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true }
    });
    
    if (!user) {
      console.error('❌ User not found in database:', userId);
      throw new Error('Invalid user ID. Please login again.');
    }
    
    console.log('✅ Creating post for user:', user.username, '| email:', user.email || 'NO EMAIL');
    const finalUserId = userId;
    
    const post = await prisma.post.create({
      data: {
        userId: finalUserId,
        platform: normalizedPlatform,
        content,
        imageUrl: imageUrl || null,
        status,
        scheduledFor: scheduledFor || null,
        createdAt: new Date()
      }
    });
    console.log('Post created in database:', post);
    
    // Send email notification if post is published immediately (not scheduled)
    if (status === 'published' && user.email) {
      console.log('📧 Sending email notification for directly published post...');
      try {
        await emailService.sendPostPublishedEmail(
          user.email,
          user.username,
          {
            platform: normalizedPlatform,
            content: content,
            platformPostId: post.id
          }
        );
        console.log('✅ Email notification sent successfully');
      } catch (emailError) {
        console.error('❌ Failed to send email notification:', emailError.message);
        // Don't fail the post creation if email fails
      }
    } else if (status === 'published' && !user.email) {
      console.log('⚠️ Post published but user has no email address - notification skipped');
    }
    
    return post;
  } catch (error) {
    console.error('Error creating post in database:', error);
    throw error;
  }
}

export async function getUserPosts(userId) {
  return await prisma.post.findMany({ 
    where: { userId },
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getAllPosts() {
  return await prisma.post.findMany({ 
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createLog({ userId, action, details }) {
  return await prisma.log.create({
    data: {
      userId,
      action,
      details,
      createdAt: new Date()
    }
  });
}

export async function getUserLogs(userId) {
  return await prisma.log.findMany({ where: { userId } });
}

export async function getConfig(key) {
  return await prisma.config.findUnique({ where: { key } });
}

export async function setConfig(key, value) {
  return await prisma.config.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  });
}

export { prisma };
