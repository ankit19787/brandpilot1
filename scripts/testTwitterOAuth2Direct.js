/**
 * Direct Twitter OAuth 2.0 Test
 * Tests OAuth 2.0 posting without needing user login
 */

import { PrismaClient } from '@prisma/client';
import { postTweetOAuth2 } from '../services/twitterOAuth2.js';

const prisma = new PrismaClient();

async function testOAuth2() {
  console.log('\n🐦 Twitter OAuth 2.0 Direct Test\n');

  try {
    // Get OAuth 2.0 access token from database
    console.log('📥 Fetching OAuth 2.0 credentials...');
    const tokenConfig = await prisma.config.findUnique({
      where: { key: 'x_oauth2_access_token' }
    });

    if (!tokenConfig || !tokenConfig.value) {
      console.error('❌ OAuth 2.0 access token not found in database');
      console.log('\nRun: node scripts/getTwitterAuthUrl.js');
      console.log('Then: node scripts/getTwitterOAuth2Token.js <code>');
      process.exit(1);
    }

    const accessToken = tokenConfig.value;
    console.log('✅ Access token found:', accessToken.substring(0, 20) + '...');

    // Post test tweet
    const testMessage = `🚀 BrandPilot OAuth 2.0 Test - ${new Date().toLocaleString()} #OAuth2 #BrandPilot`;
    console.log('\n📤 Posting test tweet...');
    console.log('Message:', testMessage);

    const result = await postTweetOAuth2(accessToken, testMessage);

    if (result.success) {
      console.log('\n✅ SUCCESS! Tweet posted via OAuth 2.0');
      console.log('Tweet ID:', result.data.id);
      console.log('Tweet Text:', result.data.text);
      console.log('\n🎉 OAuth 2.0 is working perfectly!');
      console.log('📊 Rate Limit: 100 tweets/day (2x OAuth 1.0a)');
    } else {
      console.log('\n❌ FAILED to post tweet');
      console.log('Error:', result.error);
      
      if (result.error?.includes('401')) {
        console.log('\n⚠️ Access token may be expired or invalid');
        console.log('Try refreshing the token or re-authorize:');
        console.log('  1. node scripts/getTwitterAuthUrl.js');
        console.log('  2. node scripts/getTwitterOAuth2Token.js <code>');
      }
    }

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testOAuth2();
