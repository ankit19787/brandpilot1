// Server-side only version of gemini service
// This file should only be imported by server.js, never by frontend components

import { GoogleGenAI, Type } from "@google/genai";
import { BrandDNA, ContentStrategy } from "../types";
import { uploadToCloudinary } from "./cloudinaryUpload";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to fetch config value from DB
async function getConfigValue(key: string): Promise<string> {
  const config = await prisma.config.findUnique({ where: { key } });
  return config?.value || "";
}

// Configurable caption length for Instagram (can be changed per client or .env)
export async function getInstagramCaptionLength(): Promise<number> {
  const val = await getConfigValue('instagram_caption_length');
  return Number(val) || 300;
}

// Helper to get all credentials at once
async function getAllCredentials() {
  const configs = await prisma.config.findMany();
  return Object.fromEntries(configs.map((c: any) => [c.key, c.value]));
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

export const analyzeBrandDNA = async (pastPosts: string): Promise<BrandDNA> => {
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
  } catch (error: any) {
    console.error("Brand DNA analysis error:", error);
    if (error.response) {
      console.error("Gemini API error response:", error.response);
    }
    throw new Error(`Brand DNA synthesis failed: ${error.message}`);
  }
};

export const generateContentStrategy = async (dna: BrandDNA): Promise<ContentStrategy> => {
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
  } catch (error: any) {
    console.error("Content strategy error:", error);
    if (error.response) {
      console.error("Gemini API error response:", error.response);
    }
    throw new Error(`Strategy synthesis failed: ${error.message}`);
  }
};

export const generatePost = async (platform: string, topic: string, dna: BrandDNA): Promise<string> => {
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
  } catch (error: any) {
    console.error("Post generation error:", error);
    if (error.response) {
      console.error("Gemini API error response:", error.response);
    }
    throw new Error(`Post generation failed: ${error.message}`);
  }
};

export const generateImage = async (topic: string, dna: BrandDNA): Promise<string> => {
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
  } catch (error: any) {
    console.error("Image generation error:", error);
    if (error.response) {
      console.error("Gemini API error response:", error.response);
    }
    throw new Error(`Image generation failed: ${error.message}`);
  }
};

export async function fetchFacebookTokenFromBackend(): Promise<string> {
  const { backendApiUrl } = await getPlatformConfig();
  const res = await fetch(`${backendApiUrl}/api/facebook-token`);
  const data = await res.json();
  if (!res.ok || !data.token) {
    throw new Error(data.error || 'Failed to fetch Facebook token from backend');
  }
  return data.token;
}

export async function refreshFacebookToken(longLivedToken: string): Promise<string> {
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

export async function ensureLongLivedFacebookToken(token: string): Promise<string> {
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

export async function publishToPlatform(platform: string, content: string, metadata?: { imageUrl?: string }) {
  // This will be called via API endpoint
  const creds = await getAllCredentials();
  const platformConfig = await getPlatformConfig();
  
  // Implementation similar to the original platformAPI.publish
  // but simplified for server-side execution
  
  if (platform === 'Instagram' || platform === 'Facebook') {
    const isInstagram = platform === 'Instagram';
    let token;
    if (isInstagram) {
      token = creds['instagram_wa_token'];
    } else {
      token = await fetchFacebookTokenFromBackend();
    }
    const id = isInstagram ? creds['instagram_business_id'] : creds['facebook_page_id'];
    const apiUrl = isInstagram ? platformConfig.instagramApiUrl : platformConfig.facebookApiUrl;
    const apiVersion = platformConfig.facebookApiVersion;

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
      const formData = new FormData();
      formData.append('image_url', imageUrl);
      formData.append('caption', caption);
      formData.append('media_type', 'IMAGE');
      formData.append('access_token', token);
      
      const res1 = await fetch(`${apiUrl}/${apiVersion}/${id}/media`, {
        method: 'POST',
        body: formData
      });
      const data1 = await res1.json();
      if (!res1.ok || !data1.id) {
        throw new Error(data1.error?.message || "Instagram Media Container Error");
      }
      
      const publishFormData = new FormData();
      publishFormData.append('creation_id', data1.id);
      publishFormData.append('access_token', token);
      const res2 = await fetch(`${apiUrl}/${apiVersion}/${id}/media_publish`, {
        method: 'POST',
        body: publishFormData
      });
      const data2 = await res2.json();
      if (!res2.ok) {
        throw new Error(data2.error?.message || "Instagram Publish Error");
      }
      return { status: 201, id: data2.id, url: `instagram.com/p/${data2.id}` };
    } else {
      if (imageUrl) {
        const formData = new FormData();
        formData.append('url', imageUrl);
        formData.append('caption', caption);
        formData.append('access_token', token);
        const res = await fetch(`${apiUrl}/${apiVersion}/${id}/photos`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || "FB Photo Error");
        return { status: 201, id: data.id, url: `facebook.com/${data.id}` };
      } else {
        const res = await fetch(`${apiUrl}/${apiVersion}/${id}/feed`, {
          method: 'POST',
          body: new URLSearchParams({ message: caption, access_token: token })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || "FB Error");
        return { status: 201, id: data.id, url: `facebook.com/${data.id}` };
      }
    }
  }
  
  return { status: 201, id: "mock_" + Date.now(), url: "#" };
}

export const getMonetizationPlan = async (dna: BrandDNA, metrics: any): Promise<any> => {
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
  } catch (error: any) {
    console.error("Monetization plan error:", error);
    if (error.response) {
      console.error("Gemini API error response:", error.response);
    }
    throw new Error(`Monetization synthesis failed: ${error.message}`);
  }
};

export async function createPost({ userId, platform, content, imageUrl, status, scheduledFor }: {
  userId: string,
  platform: string,
  content: string,
  imageUrl?: string,
  status: string,
  scheduledFor?: Date
}) {
  return await prisma.post.create({
    data: {
      userId,
      platform,
      content,
      imageUrl,
      status,
      scheduledFor,
      createdAt: new Date()
    }
  });
}

export async function getUserPosts(userId: string) {
  return await prisma.post.findMany({ where: { userId } });
}

export async function createLog({ userId, action, details }: {
  userId?: string,
  action: string,
  details?: string
}) {
  return await prisma.log.create({
    data: {
      userId,
      action,
      details,
      createdAt: new Date()
    }
  });
}

export async function getUserLogs(userId: string) {
  return await prisma.log.findMany({ where: { userId } });
}

export async function getConfig(key: string) {
  return await prisma.config.findUnique({ where: { key } });
}

export async function setConfig(key: string, value: string) {
  return await prisma.config.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  });
}

export { prisma };
