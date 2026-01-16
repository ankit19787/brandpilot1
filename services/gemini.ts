import { GoogleGenAI, Type } from "@google/genai";
import { BrandDNA, ContentStrategy } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || "" });

/**
 * PRODUCTION CREDENTIALS
 */
const INSTAGRAM_WA_TOKEN = import.meta.env.VITE_INSTAGRAM_WA_TOKEN as string;
const FACEBOOK_PRODUCTION_TOKEN = import.meta.env.VITE_FACEBOOK_PRODUCTION_TOKEN as string;

// X (Twitter) Production Credentials (OAuth 1.0a)
const X_API_KEY = import.meta.env.VITE_X_API_KEY as string;
const X_API_SECRET = import.meta.env.VITE_X_API_SECRET as string;
const X_ACCESS_TOKEN = import.meta.env.VITE_X_ACCESS_TOKEN as string;
const X_ACCESS_SECRET = import.meta.env.VITE_X_ACCESS_SECRET as string;

const INSTAGRAM_BUSINESS_ID = import.meta.env.VITE_INSTAGRAM_BUSINESS_ID as string;
const FACEBOOK_PAGE_ID = import.meta.env.VITE_FACEBOOK_PAGE_ID as string;

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
      throw new Error("Empty response from Brand DNA analysis model.");
    }
    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("Brand DNA analysis error:", error.message);
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
      throw new Error("Empty response from strategy generation model.");
    }
    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("Content strategy error:", error.message);
    throw new Error(`Strategy synthesis failed: ${error.message}`);
  }
};

export const generatePost = async (platform: string, topic: string, dna: BrandDNA): Promise<string> => {
  try {
    if (!import.meta.env.VITE_API_KEY) {
      throw new Error("API_KEY is not configured. Please add VITE_API_KEY to your .env file.");
    }
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a ${platform} post about "${topic}". DNA: ${JSON.stringify(dna)}`,
    });
    if (!response.text) {
      throw new Error("AI synthesis failed: Empty response from model. Check API quota and credentials.");
    }
    return response.text;
  } catch (error: any) {
    console.error("Post generation error:", error.message);
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
    throw new Error("No image generated from model response.");
  } catch (error: any) {
    console.error("Image generation error:", error.message);
    throw new Error(`Image generation failed: ${error.message}`);
  }
};

// Facebook token refresh utilities

// Utility to fetch latest Facebook token from backend
export async function fetchFacebookTokenFromBackend(): Promise<string> {
  const res = await fetch('http://localhost:3001/api/facebook-token');
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
    // Optionally: update .env automatically (requires backend or user prompt)
    // For now, just log the new token
    console.warn("Replace VITE_FACEBOOK_PRODUCTION_TOKEN in your .env with this long-lived token:", data.access_token);
    return data.access_token;
  }
  return token;
}

export const platformAPI = {
  async publish(platform: string, content: string, onStatus: (status: string) => void, metadata?: { imageUrl?: string }) {
    onStatus(`Preparing ${platform} transmission...`);

    if (platform === 'X (Twitter)') {
      const twitterApiUrl = "https://api.twitter.com/2/tweets";
      const proxyUrl = "/api/twitter/2/tweets";
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
      
      try {
        if (isInstagram) {
          onStatus("Step 1: Validating Image URL...");
          const imageUrl = metadata?.imageUrl;
          
          if (!imageUrl) {
            throw new Error("Instagram posts require an image URL. Please provide a public image URL in 'Public Image URL' field.");
          }
          
          // Validate URL format
          try {
            new URL(imageUrl);
          } catch (e) {
            throw new Error(`Invalid image URL format: ${imageUrl}. Must be a valid HTTP/HTTPS URL.`);
          }

          onStatus("Step 2: Creating Instagram Media Container...");
          
          // Build form data exactly as Instagram expects
          const formData = new FormData();
          formData.append('image_url', imageUrl);
          formData.append('caption', content);
          formData.append('media_type', 'IMAGE');
          formData.append('access_token', token);
          
          onStatus(`Sending request with image: ${imageUrl}`);
          console.log("Instagram API Request to:", `https://graph.facebook.com/v20.0/${id}/media`);
          console.log("With parameters - image_url, caption, media_type, access_token");
          
          const res1 = await fetch(`https://graph.facebook.com/v20.0/${id}/media`, {
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
          
          const res2 = await fetch(`https://graph.facebook.com/v20.0/${id}/media_publish`, {
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
          onStatus("Publishing to Facebook Page...");
          const res = await fetch(`https://graph.facebook.com/v20.0/${id}/feed`, {
            method: 'POST',
            body: new URLSearchParams({ message: content, access_token: token })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error?.message || "FB Error");
          return { status: 201, id: data.id, url: `facebook.com/${data.id}` };
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
      throw new Error("Empty response from monetization plan model.");
    }
    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("Monetization plan error:", error.message);
    throw new Error(`Monetization synthesis failed: ${error.message}`);
  }
};