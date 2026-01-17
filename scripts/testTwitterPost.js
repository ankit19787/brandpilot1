import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import crypto from 'crypto';

const prisma = new PrismaClient();

// RFC 3986 Percent Encoding
function rfc3986Encode(str) {
  return encodeURIComponent(str).replace(/[!*'()]/g, (c) => 
    `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

// OAuth 1.0a HMAC-SHA1 Signature Generator (Node.js)
function generateTwitterOAuth1Signature(method, url, oauthParams, consumerSecret, tokenSecret) {
  const paramString = Object.keys(oauthParams)
    .sort()
    .map((k) => `${rfc3986Encode(k)}=${rfc3986Encode(oauthParams[k])}`)
    .join("&");

  const baseString = `${method.toUpperCase()}&${rfc3986Encode(url)}&${rfc3986Encode(paramString)}`;
  const signingKey = `${rfc3986Encode(consumerSecret)}&${rfc3986Encode(tokenSecret)}`;

  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(baseString)
    .digest('base64');

  return signature;
}

async function testTwitterPost() {
  try {
    console.log('🔍 Fetching credentials from database...');
    const configs = await prisma.config.findMany();
    const creds = Object.fromEntries(configs.map(c => [c.key, c.value]));
    
    console.log('✅ Credentials found:');
    console.log('   x_api_key:', creds['x_api_key'] ? '✓' : '✗');
    console.log('   x_api_secret:', creds['x_api_secret'] ? '✓' : '✗');
    console.log('   x_access_token:', creds['x_access_token'] ? '✓' : '✗');
    console.log('   x_access_secret:', creds['x_access_secret'] ? '✓' : '✗');
    console.log('   twitter_api_url:', creds['twitter_api_url'] || 'NOT SET');
    console.log('   backend_api_url:', creds['backend_api_url'] || 'NOT SET');
    
    if (!creds['x_api_key'] || !creds['x_api_secret'] || !creds['x_access_token'] || !creds['x_access_secret']) {
      throw new Error('Missing required Twitter credentials');
    }

    const twitterApiUrl = creds['twitter_api_url'] || 'https://api.twitter.com';
    const backendApiUrl = creds['backend_api_url'] || 'http://localhost:3001';
    const twitterApiFullUrl = `${twitterApiUrl}/2/tweets`;
    const proxyUrl = `${backendApiUrl}/api/twitter/2/tweets`;

    console.log('\n🔐 Generating OAuth 1.0a signature...');
    const nonce = crypto.randomBytes(16).toString('hex');
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const oauthParams = {
      oauth_consumer_key: creds['x_api_key'],
      oauth_token: creds['x_access_token'],
      oauth_nonce: nonce,
      oauth_timestamp: timestamp,
      oauth_signature_method: "HMAC-SHA1",
      oauth_version: "1.0",
    };

    const signature = generateTwitterOAuth1Signature(
      "POST", 
      twitterApiFullUrl, 
      oauthParams, 
      creds['x_api_secret'], 
      creds['x_access_secret']
    );
    oauthParams["oauth_signature"] = signature;

    const authHeader = "OAuth " + Object.keys(oauthParams)
      .sort()
      .map((k) => `${rfc3986Encode(k)}=\"${rfc3986Encode(oauthParams[k])}\"`)
      .join(", ");

    console.log('✅ OAuth signature generated');
    console.log('   Auth Header:', authHeader.substring(0, 100) + '...');

    const testMessage = `Test from script at ${new Date().toLocaleTimeString()} 🚀`;
    
    console.log(`\n🚀 Posting to Twitter via proxy: ${proxyUrl}`);
    console.log('   Message:', testMessage);

    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: testMessage })
    });

    console.log('📡 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('\n✅ SUCCESS! Tweet posted!');
    console.log('   Tweet ID:', result.data?.id || 'unknown');
    console.log('   Full response:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testTwitterPost();
