/**
 * Test Twitter posting with media/images
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001';

async function testTwitterWithMedia() {
  console.log('\n📸 TESTING TWITTER WITH MEDIA UPLOAD\n');
  console.log('='.repeat(60));

  try {
    // Example image URL (using a public test image)
    const testImageUrl = 'https://picsum.photos/800/600';
    const testText = 'Testing Twitter media upload! 📸 #test';

    console.log('\n1️⃣ Test Configuration:');
    console.log('   Text:', testText);
    console.log('   Image URL:', testImageUrl);
    console.log('   Endpoint: /api/twitter/post');

    console.log('\n2️⃣ Posting tweet with media...');
    const response = await fetch(`${API_URL}/api/twitter/post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: testText,
        media: testImageUrl,
        priority: 0
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('\n✅ SUCCESS! Tweet posted with media');
      console.log('\n📊 Response Data:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.data?.id) {
        console.log('\n🔗 Tweet URL:');
        console.log(`   https://twitter.com/user/status/${data.data.id}`);
      }
      
      console.log('\n🎯 Auth Method:', data.authMethod || 'unknown');
    } else {
      console.log('\n❌ FAILED to post tweet');
      console.log('   Status:', response.status);
      console.log('   Error:', data.error || data.message);
      
      if (data.rateLimitInfo) {
        console.log('\n⏱️ Rate Limit Info:');
        console.log('   Limit:', data.rateLimitInfo.limit);
        console.log('   Remaining:', data.rateLimitInfo.remaining);
        console.log('   Reset Time:', data.rateLimitInfo.resetTime);
        console.log('   Message:', data.message);
      }
    }

  } catch (error) {
    console.error('\n💥 ERROR:', error.message);
    console.error(error.stack);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✨ Test completed!\n');
}

// Run test
testTwitterWithMedia().catch(console.error);
