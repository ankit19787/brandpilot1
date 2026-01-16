// Server-side only version of gemini service
// This file should only be imported by server.js, never by frontend components

import { GoogleGenAI, Type } from "@google/genai";
import { uploadToCloudinary } from "./cloudinaryUpload.js";
import { PrismaClient } from '@prisma/client';
import FormData from 'form-data';

const prisma = new PrismaClient();

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
  const url = `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${longLivedToken}`;
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
    const url = `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${token}`;
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
  
  if (platform === 'Instagram' || platform === 'Facebook') {
    const isInstagram = platform === 'Instagram';
    let token;
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
      if (!res1.ok || !data1.id) {
        throw new Error(data1.error?.message || "Instagram Media Container Error");
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
      if (!res2.ok) {
        throw new Error(data2.error?.message || "Instagram Publish Error");
      }
      return { status: 201, id: data2.id, url: `instagram.com/p/${data2.id}` };
    } else {
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
        if (!res.ok) throw new Error(data.error?.message || "FB Photo Error");
        return { status: 201, id: data.id, url: `facebook.com/${data.id}` };
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
        if (!res.ok) throw new Error(data.error?.message || "FB Error");
        return { status: 201, id: data.id, url: `facebook.com/${data.id}` };
      }
    }
  }
  
  return { status: 201, id: "mock_" + Date.now(), url: "#" };
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
  console.log('createPost called with:', { userId, platform, content, imageUrl, status, scheduledFor });
  try {
    // If userId is not a valid UUID or is 'default_user', try to find or create a default user
    let finalUserId = userId;
    if (!userId || userId === 'default_user') {
      // Try to find an admin user or any user
      const user = await prisma.user.findFirst({
        orderBy: { createdAt: 'asc' }
      });
      
      if (user) {
        finalUserId = user.id;
      } else {
        // Create a default user if none exists
        const defaultUser = await prisma.user.create({
          data: {
            username: 'default_user',
            passwordHash: 'not_used',
            role: 'admin',
            createdAt: new Date()
          }
        });
        finalUserId = defaultUser.id;
      }
    }
    
    const post = await prisma.post.create({
      data: {
        userId: finalUserId,
        platform,
        content,
        imageUrl: imageUrl || null,
        status,
        scheduledFor: scheduledFor || null,
        createdAt: new Date()
      }
    });
    console.log('Post created in database:', post);
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
