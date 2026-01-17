
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
    cloudinaryApiUrl: await getConfigValue('cloudinary_api_url'),
    cloudinaryApiVersion: await getConfigValue('cloudinary_api_version'),
  };
}

/**
 * RFC 3986 Percent Encoding
 */
function rfc3986Encode(str: string): string {
  return encodeURIComponent(str).replace(/[!*'()]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

/**
 * OAuth 1.0a HMAC-SHA1 Signature Generator (Browser Compatible)
 */
async function generateTwitterOAuth1Signature(
  method: string,
  url: string,
  oauthParams: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): Promise<string> {
  const paramString = Object.keys(oauthParams)
    .sort()
    .map((k) => `${rfc3986Encode(k)}=${rfc3986Encode(oauthParams[k])}`)
    .join("&");

  const baseString = `${method.toUpperCase()}&${rfc3986Encode(url)}&${rfc3986Encode(paramString)}`;
  const signingKey = `${rfc3986Encode(consumerSecret)}&${rfc3986Encode(tokenSecret)}`;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(signingKey);
  const messageData = encoder.encode(baseString);

  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );

  const signature = await window.crypto.subtle.sign("HMAC", cryptoKey, messageData);
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
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
    let prompt = `Generate a ${platform} post about \"${topic}\". DNA: ${JSON.stringify(dna)}\nLimit the post/caption to ${captionLength} characters or less.`;
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

// Facebook token refresh utilities

// Utility to fetch latest Facebook token from backend
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
  const { facebookApiUrl, facebookApiVersion } = await getPlatformConfig();
  const url = `${facebookApiUrl}/${facebookApiVersion}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${longLivedToken}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error?.message || "Failed to refresh Facebook token");
  }
  return data.access_token;
}

// Store last refresh time in-memory (could be persisted)
let facebookTokenLastRefresh: number | null = null;
let facebookTokenCache: string | null = null;

async function getValidFacebookToken(token: string): Promise<string> {
  const now = Date.now();
  // Refresh if older than 55 minutes (token expires in 60)
  if (!facebookTokenLastRefresh || !facebookTokenCache || (now - facebookTokenLastRefresh) > 55 * 60 * 1000) {
    try {
      const refreshed = await refreshFacebookToken(token);
      facebookTokenCache = refreshed;
      facebookTokenLastRefresh = now;
      return refreshed;
    } catch (err) {
      // fallback to original token if refresh fails
      return token;
    }
  }
  return facebookTokenCache;
}

// Utility: Automatically exchange short-lived Facebook token for long-lived token
export async function ensureLongLivedFacebookToken(token: string): Promise<string> {
  // Facebook long-lived tokens are ~180 chars, short-lived are ~70-90 chars
  if (token.length < 120) {
    // Exchange for long-lived token
    const appId = await getConfigValue('facebook_app_id');
    const appSecret = await getConfigValue('facebook_app_secret');
    const { facebookApiUrl, facebookApiVersion } = await getPlatformConfig();
    const url = `${facebookApiUrl}/${facebookApiVersion}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${token}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || !data.access_token) {
      throw new Error(data.error?.message || "Failed to get long-lived Facebook token");
    }
    // In production (Vercel), you must update the environment variable manually
    console.warn('[ACTION REQUIRED] New Facebook long-lived token generated. Please update VITE_FACEBOOK_PRODUCTION_TOKEN in your Vercel dashboard:', data.access_token);
    return data.access_token;
  }
  return token;
}

export const platformAPI = {
  async publish(platform: string, content: string, onStatus: (status: string) => void, metadata?: { imageUrl?: string }) {
    console.log('[platformAPI.publish] Called with platform:', platform);
    onStatus(`Preparing ${platform} transmission...`);

    // Check for Twitter/X platform (handle variations)
    if (platform === 'X (Twitter)' || platform === 'Twitter' || platform.toLowerCase().includes('twitter') || platform.toLowerCase().includes('x (')) {
      console.log('[platformAPI.publish] Matched Twitter/X block');
      const { backendApiUrl } = await getPlatformConfig();
      console.log('[platformAPI.publish] Backend URL:', backendApiUrl);
      
      if (!backendApiUrl) {
        console.error('[platformAPI.publish] ERROR: backendApiUrl is empty!');
        throw new Error('Backend API URL not configured. Please set backend_api_url in database.');
      }
      
      // Use the working endpoint that the test script uses
      const twitterEndpoint = `${backendApiUrl}/api/twitter/post`;
      
      onStatus("Sending tweet to backend...");
      console.log('[platformAPI.publish] Posting to:', twitterEndpoint);
      
      try {
        const res = await fetch(twitterEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: content }),
        });

        console.log('[platformAPI.publish] Response status:', res.status);
        if (!res.ok) {
          const json = await res.json().catch(() => ({ error: "Network response was not ok" }));
          console.error('[platformAPI.publish] Error response:', json);
          throw new Error(json.error || `Twitter API Error: ${res.status}`);
        }

        const json = await res.json();
        console.log('[platformAPI.publish] Success response:', json);
        onStatus(`Published successfully! ID: ${json.data.id}`);
        return { status: 201, id: json.data.id, url: `https://x.com/i/web/status/${json.data.id}` };
      } catch (err: any) {
        console.error('[platformAPI.publish] Caught error:', err);
        onStatus(`Twitter Error: ${err.message}`);
        throw err;
      }
    }

    console.log('[platformAPI.publish] Did not match X (Twitter), checking Instagram/Facebook...');
    if (platform === 'Instagram' || platform === 'Facebook') {
      const creds = await getAllCredentials();
      const { instagramApiUrl, facebookApiUrl, facebookApiVersion } = await getPlatformConfig();
      const isInstagram = platform === 'Instagram';
      let token;
      if (isInstagram) {
        token = creds['instagram_wa_token'];
      } else {
        // Always fetch latest Facebook token from backend
        token = await fetchFacebookTokenFromBackend();
      }
      const id = isInstagram ? creds['instagram_business_id'] : creds['facebook_page_id'];
      const apiUrl = isInstagram ? instagramApiUrl : facebookApiUrl;
      const apiVersion = facebookApiVersion;

      try {
        // --- Unified logic for Instagram and Facebook image posting ---
        onStatus("Step 1: Validating Image URL (if provided)...");
        let imageUrl = metadata?.imageUrl;
        let isImagePost = !!imageUrl;
        if (imageUrl) {
          // If imageUrl is a data/base64 URL, upload to Cloudinary and use the returned public URL
          if (imageUrl.startsWith('data:')) {
            onStatus('Uploading image to Cloudinary for public access...');
            try {
              imageUrl = await uploadToCloudinary(imageUrl);
              onStatus('Image uploaded to Cloudinary.');
            } catch (err: any) {
              throw new Error('Failed to upload image to Cloudinary: ' + (err.message || err));
            }
          }
          // Validate URL format and ensure it's not a blob URL
          try {
            const urlObj = new URL(imageUrl);
            if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
              throw new Error();
            }
            if (imageUrl.startsWith('blob:')) {
              throw new Error('Image URL cannot be a blob URL. Please provide a public HTTP/HTTPS image URL.');
            }
          } catch (e) {
            if (typeof e === 'string' && e.includes('blob')) {
              throw new Error(e);
            }
            throw new Error(`Invalid image URL format: ${imageUrl}. Must be a valid HTTP/HTTPS URL and not a blob URL.`);
          }
        }

        // Instagram: image post required, Facebook: image optional
        if (isInstagram && !imageUrl) {
          throw new Error("Instagram posts require an image URL. Please provide a public image URL in 'Public Image URL' field.");
        }

        // Enforce caption/content length for all platforms
        const captionLength = await getInstagramCaptionLength();
        const caption = content.length > captionLength ? content.slice(0, captionLength) : content;

        if (isInstagram) {
          onStatus("Step 2: Creating Instagram Media Container...");
          const formData = new FormData();
          formData.append('image_url', imageUrl);
          formData.append('caption', caption);
          formData.append('media_type', 'IMAGE');
          formData.append('access_token', token);
          onStatus(`Sending request with image: ${imageUrl}`);
          console.log("Instagram API Request to:", `${apiUrl}/${apiVersion}/${id}/media`);
          console.log("With parameters - image_url, caption, media_type, access_token");
          const res1 = await fetch(`${apiUrl}/${apiVersion}/${id}/media`, {
            method: 'POST',
            body: formData
          });
          const data1 = await res1.json();
          console.log("Instagram API Response 1:", data1);
          if (!res1.ok) {
            const errorDetails = data1.error;
            const errorMsg = errorDetails?.message || JSON.stringify(errorDetails);
            const errorCode = errorDetails?.code || errorDetails?.error_code || res1.status;
            // More detailed error message
            if (errorCode === 100) {
              throw new Error(`Instagram Error #100 - Invalid Parameter. Details: ${errorMsg}. Check if image_url is publicly accessible, caption length is valid, or if access token has required permissions.`);
            }
            throw new Error(`Instagram Media Container Error [${errorCode}]: ${errorMsg}`);
          }
          if (!data1.id) {
            throw new Error("No media ID returned from Instagram. Response: " + JSON.stringify(data1));
          }
          onStatus("Step 3: Publishing to Instagram Feed...");
          const publishFormData = new FormData();
          publishFormData.append('creation_id', data1.id);
          publishFormData.append('access_token', token);
          const res2 = await fetch(`${apiUrl}/${apiVersion}/${id}/media_publish`, {
            method: 'POST',
            body: publishFormData
          });
          const data2 = await res2.json();
          console.log("Instagram API Response 2:", data2);
          if (!res2.ok) {
            const errorDetails = data2.error;
            throw new Error(`Instagram Publish Error [${errorDetails?.code || res2.status}]: ${errorDetails?.message || JSON.stringify(errorDetails)}`);
          }
          onStatus(`Published successfully to Instagram!`);
          return { status: 201, id: data2.id, url: `https://instagram.com/p/${data2.id}` };
        } else {
          if (isImagePost) {
            onStatus("Step 2: Publishing image post to Facebook Page...");
            // Facebook photo endpoint: /{page-id}/photos
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
            return { status: 201, id: data.id, url: `https://facebook.com/${data.id}` };
          } else {
            onStatus("Publishing text post to Facebook Page...");
            const res = await fetch(`${apiUrl}/${apiVersion}/${id}/feed`, {
              method: 'POST',
              body: new URLSearchParams({ message: caption, access_token: token })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message || "FB Error");
            return { status: 201, id: data.id, url: `https://facebook.com/${data.id}` };
          }
        }
      } catch (err: any) {
        onStatus(`Meta Gateway Error: ${err.message}`);
        throw err;
      }
    }

    console.log('[platformAPI.publish] Falling back to mock response for platform:', platform);
    onStatus(`Simulation: Post pushed to ${platform}.`);
    return { status: 201, id: "mock_" + Date.now(), url: "#" };
  }
};

export const publishToPlatform = async (platform: string, content: string, metadata?: { imageUrl?: string }) => {
  return await platformAPI.publish(platform, content, () => {}, metadata);
};

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

// Add function to create a post in the database
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

// Add function to fetch posts for a user
export async function getUserPosts(userId: string) {
  return await prisma.post.findMany({ where: { userId } });
}

// Add function to create a log entry in the database
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

// Add function to fetch logs for a user
export async function getUserLogs(userId: string) {
  return await prisma.log.findMany({ where: { userId } });
}

// Add function to get config value by key
export async function getConfig(key: string) {
  return await prisma.config.findUnique({ where: { key } });
}

// Add function to set/update config value
export async function setConfig(key: string, value: string) {
  return await prisma.config.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  });
}