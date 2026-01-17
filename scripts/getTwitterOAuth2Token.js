/**
 * Exchange authorization code for OAuth 2.0 access token
 * Step 2 of OAuth 2.0 flow
 */

import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CLIENT_ID = 'Y3F6TUtSMUh6X3JGaGRkdllPZ1c6MTpjaQ';
const CLIENT_SECRET = 'khK6ik6FhbCYiRSZmU6S6ey3YiDAzWd4M5_uZRe34klt-Z4-pV';
const REDIRECT_URI = 'http://localhost:3001/api/twitter/oauth2/callback';
const CODE_VERIFIER = 'challenge'; // Must match code_challenge

async function getAccessToken(code) {
  console.log('\n🐦 Exchanging authorization code for access token...\n');

  const params = new URLSearchParams({
    code,
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    code_verifier: CODE_VERIFIER
  });

  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

  try {
    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: params.toString()
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error:', data);
      console.error('\nPossible issues:');
      console.error('  - Authorization code expired (valid for 30 seconds)');
      console.error('  - Code already used');
      console.error('  - Redirect URI mismatch');
      process.exit(1);
    }

    console.log('✅ Access token received!\n');

    // Save to database
    await prisma.config.upsert({
      where: { key: 'x_oauth2_access_token' },
      update: { value: data.access_token },
      create: { key: 'x_oauth2_access_token', value: data.access_token }
    });

    await prisma.config.upsert({
      where: { key: 'x_oauth2_refresh_token' },
      update: { value: data.refresh_token },
      create: { key: 'x_oauth2_refresh_token', value: data.refresh_token }
    });

    console.log('✅ Tokens saved to database\n');
    console.log('Token details:');
    console.log(`  Access Token: ${data.access_token.substring(0, 20)}...`);
    console.log(`  Refresh Token: ${data.refresh_token.substring(0, 20)}...`);
    console.log(`  Expires in: ${data.expires_in} seconds (${Math.floor(data.expires_in / 60)} minutes)`);
    console.log(`  Token Type: ${data.token_type}`);
    console.log(`  Scope: ${data.scope}`);
    console.log('\n🎉 OAuth 2.0 setup complete!');
    console.log('   You can now post 100 tweets/day (2x more than OAuth 1.0a)\n');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Failed:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

const code = process.argv[2];

if (!code) {
  console.error('\n❌ Error: Authorization code required');
  console.error('\nUsage: node scripts/getTwitterOAuth2Token.js <code>');
  console.error('\nGet the code by running: node scripts/getTwitterAuthUrl.js\n');
  process.exit(1);
}

getAccessToken(code);
