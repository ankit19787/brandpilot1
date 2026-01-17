/**
 * Test Rate Limit Display
 * Simulates a rate limit error to show the user-friendly message
 */

import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

async function testRateLimitDisplay() {
  console.log('\n🧪 Testing Rate Limit Display\n');

  try {
    // Get a valid access token
    const authData = await prisma.user.findFirst({
      where: { email: { not: null } },
      select: { id: true, email: true }
    });

    if (!authData) {
      console.log('❌ No user found. Please login first.');
      return;
    }

    // Try to post a tweet (will likely hit rate limit)
    console.log('📤 Attempting to post tweet...');
    
    const response = await fetch('http://localhost:3001/api/twitter/post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer fake_token_for_test`
      },
      body: JSON.stringify({
        text: `Test tweet - ${new Date().toISOString()}`
      })
    });

    const data = await response.json();

    if (response.status === 429) {
      console.log('\n✅ Rate Limit Error Received (as expected)\n');
      console.log('📋 Error Message for User:');
      console.log('━'.repeat(80));
      console.log(`   ${data.message}`);
      console.log('━'.repeat(80));
      
      if (data.rateLimitInfo) {
        console.log('\n📊 Rate Limit Details:');
        console.log(`   Limit: ${data.rateLimitInfo.limit} posts per 24 hours`);
        console.log(`   Remaining: ${data.rateLimitInfo.remaining}`);
        console.log(`   Reset Time: ${data.rateLimitInfo.resetTime}`);
        console.log(`   Time Until Reset: ${data.rateLimitInfo.timeMessage}`);
      }
      
      console.log('\n💡 This is what the user will see in the app!');
    } else if (response.ok) {
      console.log('✅ Tweet posted successfully!');
      console.log('Tweet ID:', data.data?.id);
    } else {
      console.log('❌ Error:', data.error || data.message);
    }

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testRateLimitDisplay();
