/**
 * Twitter OAuth 2.0 Service
 * Provides higher rate limits for posting tweets
 * Free tier: 100 tweets/day vs OAuth 1.0a's 50/day
 */

import fetch from 'node-fetch';
import FormData from 'form-data';
import https from 'https';
import http from 'http';
import crypto from 'crypto';

/**
 * Upload media to Twitter using OAuth 1.0a
 * Note: Twitter's media upload endpoint only supports OAuth 1.0a, not OAuth 2.0
 * @param {Buffer} imageBuffer - Image data buffer
 * @param {Object} creds - OAuth 1.0a credentials
 * @returns {Promise<string>} Media ID
 */
async function uploadMediaOAuth1(imageBuffer, creds) {
  const uploadUrl = 'https://upload.twitter.com/1.1/media/upload.json';
  
  // Generate OAuth 1.0a signature
  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const oauthParams = {
    oauth_consumer_key: creds.apiKey,
    oauth_token: creds.accessToken,
    oauth_nonce: nonce,
    oauth_timestamp: timestamp,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_version: '1.0',
  };

  const rfc3986Encode = (str) => encodeURIComponent(str).replace(/[!*'()]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  const paramString = Object.keys(oauthParams).sort().map(k => `${rfc3986Encode(k)}=${rfc3986Encode(oauthParams[k])}`).join('&');
  const baseString = `POST&${rfc3986Encode(uploadUrl)}&${rfc3986Encode(paramString)}`;
  const signingKey = `${rfc3986Encode(creds.apiSecret)}&${rfc3986Encode(creds.accessSecret)}`;
  const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');
  oauthParams.oauth_signature = signature;

  const authHeader = 'OAuth ' + Object.keys(oauthParams).sort().map(k => `${rfc3986Encode(k)}="${rfc3986Encode(oauthParams[k])}"`).join(', ');

  const formData = new FormData();
  formData.append('media', imageBuffer, { filename: 'image.jpg' });

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      ...formData.getHeaders()
    },
    body: formData
  });

  const data = await response.json();
  
  if (!response.ok) {
    const error = new Error(data.errors?.[0]?.message || 'Media upload failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data.media_id_string;
}

/**
 * Download image from URL or convert data URL to buffer
 * @param {string} imageUrl - Image URL or data URL
 * @returns {Promise<Buffer>} Image buffer
 */
async function downloadImage(imageUrl) {
  // Handle data URLs (base64 encoded images)
  if (imageUrl.startsWith('data:')) {
    const base64Data = imageUrl.split(',')[1];
    if (!base64Data) {
      throw new Error('Invalid data URL format');
    }
    return Buffer.from(base64Data, 'base64');
  }
  
  // Handle regular HTTP/HTTPS URLs
  return new Promise((resolve, reject) => {
    const protocol = imageUrl.startsWith('https') ? https : http;
    protocol.get(imageUrl, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    });
  });
}

/**
 * Post tweet using OAuth 2.0
 * @param {string} accessToken - OAuth 2.0 Bearer token
 * @param {string} text - Tweet text
 * @param {string|Buffer} [media] - Image URL or Buffer
 * @param {Object} [oauth1Creds] - OAuth 1.0a credentials for media upload (required if media provided)
 * @returns {Promise<Object>} Tweet response
 */
export async function postTweetOAuth2(accessToken, text, media = null, oauth1Creds = null) {
  let mediaIds = [];
  
  // Upload media if provided
  // NOTE: Twitter's media upload endpoint only supports OAuth 1.0a, not OAuth 2.0
  if (media && oauth1Creds) {
    try {
      let imageBuffer;
      
      // If media is a URL, download it first
      if (typeof media === 'string') {
        console.log('Downloading image for OAuth 2.0 tweet...');
        imageBuffer = await downloadImage(media);
      } else {
        imageBuffer = media;
      }
      
      console.log('Uploading media using OAuth 1.0a (media upload requires OAuth 1.0a)...');
      const mediaId = await uploadMediaOAuth1(imageBuffer, oauth1Creds);
      mediaIds.push(mediaId);
      console.log('Media uploaded successfully, media_id:', mediaId);
    } catch (err) {
      console.error('Failed to upload media:', err);
      throw new Error(`Media upload failed: ${err.message}`);
    }
  } else if (media && !oauth1Creds) {
    throw new Error('OAuth 1.0a credentials required for media upload');
  }
  
  const url = 'https://api.twitter.com/2/tweets';
  
  const body = { text };
  if (mediaIds.length > 0) {
    body.media = { media_ids: mediaIds };
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  
  if (!response.ok) {
    const error = new Error(data.detail || data.title || 'Twitter API error');
    error.status = response.status;
    error.headers = Object.fromEntries(response.headers.entries());
    error.data = data;
    
    // Add rate limit info if it's a 429 error
    if (response.status === 429) {
      const headers = error.headers;
      error.rateLimitInfo = {
        userLimit: headers['x-user-limit-24hour-limit'],
        userRemaining: headers['x-user-limit-24hour-remaining'],
        userResetTimestamp: headers['x-user-limit-24hour-reset'],
        appLimit: headers['x-app-limit-24hour-limit'],
        appRemaining: headers['x-app-limit-24hour-remaining'],
        appResetTimestamp: headers['x-app-limit-24hour-reset']
      };
    }
    
    throw error;
  }

  return data;
}

/**
 * Refresh OAuth 2.0 access token
 * @param {string} clientId - OAuth 2.0 Client ID
 * @param {string} clientSecret - OAuth 2.0 Client Secret
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} New tokens
 */
export async function refreshOAuth2Token(clientId, clientSecret, refreshToken) {
  const url = 'https://api.twitter.com/2/oauth2/token';
  
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId
  });

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString()
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error_description || 'Failed to refresh token');
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in
  };
}

/**
 * Validate OAuth 2.0 access token
 * @param {string} accessToken - OAuth 2.0 Bearer token
 * @returns {Promise<boolean>} True if valid
 */
export async function validateOAuth2Token(accessToken) {
  try {
    const url = 'https://api.twitter.com/2/users/me';
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Get rate limit info for OAuth 2.0
 * @param {string} accessToken - OAuth 2.0 Bearer token
 * @returns {Promise<Object>} Rate limit info
 */
export async function getOAuth2RateLimits(accessToken) {
  const url = 'https://api.twitter.com/2/tweets/search/recent';
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  return {
    limit: response.headers.get('x-rate-limit-limit'),
    remaining: response.headers.get('x-rate-limit-remaining'),
    reset: response.headers.get('x-rate-limit-reset')
  };
}

export default {
  postTweetOAuth2,
  refreshOAuth2Token,
  validateOAuth2Token,
  getOAuth2RateLimits
};
