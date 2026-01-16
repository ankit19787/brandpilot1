import { GoogleGenAI, Type } from "@google/genai";
import { BrandDNA, ContentStrategy } from "../types";
import { uploadToCloudinary } from "./cloudinaryUpload";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || "" });

// Configurable caption length for Instagram (can be changed per client or .env)
export const INSTAGRAM_CAPTION_LENGTH = Number(import.meta.env.VITE_INSTAGRAM_CAPTION_LENGTH) || 300;

// All credentials loaded from .env
const INSTAGRAM_WA_TOKEN = import.meta.env.VITE_INSTAGRAM_WA_TOKEN;
const FACEBOOK_PRODUCTION_TOKEN = import.meta.env.VITE_FACEBOOK_PRODUCTION_TOKEN;
const X_API_KEY = import.meta.env.VITE_X_API_KEY;
const X_API_SECRET = import.meta.env.VITE_X_API_SECRET;
const X_ACCESS_TOKEN = import.meta.env.VITE_X_ACCESS_TOKEN;
const X_ACCESS_SECRET = import.meta.env.VITE_X_ACCESS_SECRET;
const INSTAGRAM_BUSINESS_ID = import.meta.env.VITE_INSTAGRAM_BUSINESS_ID;
const FACEBOOK_PAGE_ID = import.meta.env.VITE_FACEBOOK_PAGE_ID;

const TWITTER_API_URL = import.meta.env.VITE_TWITTER_API_URL;
const INSTAGRAM_API_URL = import.meta.env.VITE_INSTAGRAM_API_URL;
const FACEBOOK_API_URL = import.meta.env.VITE_FACEBOOK_API_URL;
const FACEBOOK_API_VERSION = import.meta.env.VITE_FACEBOOK_API_VERSION;

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
    if (!import.meta.env.VITE_API_KEY) {
      throw new Error("API_KEY is not configured. Please add VITE_API_KEY to your .env file.");
    }
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
    if (!import.meta.env.VITE_API_KEY) {
      throw new Error("API_KEY is not configured. Please add VITE_API_KEY to your .env file.");
    }
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
    if (!import.meta.env.VITE_API_KEY) {
      throw new Error("API_KEY is not configured. Please add VITE_API_KEY to your .env file.");
    }
    // For all platforms, request a post/caption of the configured length
    let prompt = `Generate a ${platform} post about \"${topic}\". DNA: ${JSON.stringify(dna)}\nLimit the post/caption to ${INSTAGRAM_CAPTION_LENGTH} characters or less.`;
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
    if (!import.meta.env.VITE_API_KEY) {
      throw new Error("API_KEY is not configured. Please add VITE_API_KEY to your .env file.");
    }
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
  const backendUrl = import.meta.env.VITE_BACKEND_API_URL;
  const res = await fetch(`${backendUrl}/api/facebook-token`);
  const data = await res.json();
  if (!res.ok || !data.token) {
    throw new Error(data.error || 'Failed to fetch Facebook token from backend');
  }
  return data.token;
}

export async function refreshFacebookToken(longLivedToken: string): Promise<string> {
  const url = `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${import.meta.env.VITE_FACEBOOK_APP_ID}&client_secret=${import.meta.env.VITE_FACEBOOK_APP_SECRET}&fb_exchange_token=${longLivedToken}`;
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
    const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
    const appSecret = import.meta.env.VITE_FACEBOOK_APP_SECRET;
    const url = `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${token}`;
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
    onStatus(`Preparing ${platform} transmission...`);

    if (platform === 'X (Twitter)') {
      const twitterApiUrl = `${TWITTER_API_URL}/2/tweets`;
      // Use backend API URL from env, fallback to localhost:3001
      const backendUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001';
      const proxyUrl = `${backendUrl}/api/twitter/2/tweets`;
      onStatus("Calculating OAuth 1.0a HMAC-SHA1 signature...");
      
      const nonce = Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const timestamp = Math.floor(Date.now() / 1000).toString();

      const oauthParams: Record<string, string> = {
        oauth_consumer_key: X_API_KEY,
        oauth_token: X_ACCESS_TOKEN,
        oauth_nonce: nonce,
        oauth_timestamp: timestamp,
        oauth_signature_method: "HMAC-SHA1",
        oauth_version: "1.0",
      };

      const signature = await generateTwitterOAuth1Signature("POST", twitterApiUrl, oauthParams, X_API_SECRET, X_ACCESS_SECRET);
      oauthParams["oauth_signature"] = signature;

      const authHeader = "OAuth " + Object.keys(oauthParams)
        .sort()
        .map((k) => `${rfc3986Encode(k)}="${rfc3986Encode(oauthParams[k])}"`)
        .join(", ");

      onStatus("Sending direct payload to api.twitter.com...");
      try {
        const res = await fetch(proxyUrl, {
          method: "POST",
          headers: {
            "Authorization": authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: content }),
        });

        if (!res.ok) {
          const json = await res.json().catch(() => ({ detail: "Network response was not ok" }));
          throw new Error(json.detail || `X API Error: ${res.status}`);
        }

        const json = await res.json();
        onStatus(`Published successfully! ID: ${json.data.id}`);
        return { status: 201, id: json.data.id, url: `x.com/status/${json.data.id}` };
      } catch (err: any) {
        if (err.message.includes('Failed to fetch')) {
          onStatus("CRITICAL: CORS Block detected. Browser blocked direct request to Twitter.");
          throw new Error("Failed to fetch: Browser blocked the request. This usually requires a server-side proxy or specific browser settings to allow api.twitter.com.");
        }
        onStatus(`Gateway Error: ${err.message}`);
        throw err;
      }
    }

    if (platform === 'Instagram' || platform === 'Facebook') {
      const isInstagram = platform === 'Instagram';
      let token;
      if (isInstagram) {
        token = INSTAGRAM_WA_TOKEN;
      } else {
        // Always fetch latest Facebook token from backend
        token = await fetchFacebookTokenFromBackend();
      }
      const id = isInstagram ? INSTAGRAM_BUSINESS_ID : FACEBOOK_PAGE_ID;
      const apiUrl = isInstagram ? INSTAGRAM_API_URL : FACEBOOK_API_URL;
      const apiVersion = FACEBOOK_API_VERSION;

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
        const caption = content.length > INSTAGRAM_CAPTION_LENGTH ? content.slice(0, INSTAGRAM_CAPTION_LENGTH) : content;

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
          return { status: 201, id: data2.id, url: `instagram.com/p/${data2.id}` };
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
            return { status: 201, id: data.id, url: `facebook.com/${data.id}` };
          } else {
            onStatus("Publishing text post to Facebook Page...");
            const res = await fetch(`${apiUrl}/${apiVersion}/${id}/feed`, {
              method: 'POST',
              body: new URLSearchParams({ message: caption, access_token: token })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message || "FB Error");
            return { status: 201, id: data.id, url: `facebook.com/${data.id}` };
          }
        }
      } catch (err: any) {
        onStatus(`Meta Gateway Error: ${err.message}`);
        throw err;
      }
    }

    onStatus(`Simulation: Post pushed to ${platform}.`);
    return { status: 201, id: "mock_" + Date.now(), url: "#" };
  }
};

export const publishToPlatform = async (platform: string, content: string, metadata?: { imageUrl?: string }) => {
  return await platformAPI.publish(platform, content, () => {}, metadata);
};

export const getMonetizationPlan = async (dna: BrandDNA, metrics: any): Promise<any> => {
  try {
    if (!import.meta.env.VITE_API_KEY) {
      throw new Error("API_KEY is not configured. Please add VITE_API_KEY to your .env file.");
    }
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