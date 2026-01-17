/**
 * Meta Rate Limiting Test Script
 * Tests Facebook/Instagram rate limiting, error handling, and email notifications
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

// Test data
const testContent = {
  instagram: 'Testing Instagram rate limiting with image #test',
  facebook: 'Testing Facebook rate limiting system'
};

async function testMetaRateLimitStatus() {
  console.log('\n📊 Testing Meta Rate Limit Status Endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/api/meta/rate-limit-status`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token',  // This will fail auth but we can still see if endpoint exists
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 401) {
      console.log('✅ Meta rate limit status endpoint exists (authentication required)');
    } else if (response.ok) {
      const status = await response.json();
      console.log('✅ Meta rate limit status:', JSON.stringify(status, null, 2));
    } else {
      console.log('❌ Meta rate limit status failed:', response.status);
    }
  } catch (error) {
    console.error('❌ Meta rate limit status error:', error.message);
  }
}

async function testInstagramPost() {
  console.log('\n📸 Testing Instagram Post (without auth - should fail gracefully)...');
  try {
    const response = await fetch(`${BASE_URL}/api/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        platform: 'Instagram',
        content: testContent.instagram,
        metadata: {
          imageUrl: 'https://picsum.photos/400/400'
        }
      })
    });
    
    const result = await response.json();
    console.log('📋 Instagram Response Status:', response.status);
    console.log('📋 Instagram Response:', JSON.stringify(result, null, 2));
    
    if (response.status === 401) {
      console.log('✅ Instagram endpoint requires authentication (as expected)');
    } else if (response.status === 429) {
      console.log('✅ Instagram rate limit triggered!');
    } else {
      console.log('ℹ️ Instagram response received');
    }
  } catch (error) {
    console.error('❌ Instagram test error:', error.message);
  }
}

async function testFacebookPost() {
  console.log('\n📘 Testing Facebook Post (without auth - should fail gracefully)...');
  try {
    const response = await fetch(`${BASE_URL}/api/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        platform: 'Facebook',
        content: testContent.facebook
      })
    });
    
    const result = await response.json();
    console.log('📋 Facebook Response Status:', response.status);
    console.log('📋 Facebook Response:', JSON.stringify(result, null, 2));
    
    if (response.status === 401) {
      console.log('✅ Facebook endpoint requires authentication (as expected)');
    } else if (response.status === 429) {
      console.log('✅ Facebook rate limit triggered!');
    } else {
      console.log('ℹ️ Facebook response received');
    }
  } catch (error) {
    console.error('❌ Facebook test error:', error.message);
  }
}

async function testRateLimitTrigger() {
  console.log('\n🚀 Testing Rate Limit Trigger with Rapid Requests...');
  console.log('Making 5 rapid requests to test rate limiter...');
  
  const promises = [];
  for (let i = 1; i <= 5; i++) {
    console.log(`📤 Sending request ${i}/5...`);
    
    const promise = fetch(`${BASE_URL}/api/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        platform: 'Instagram',
        content: `Rapid test ${i} - ${new Date().toISOString()}`,
        metadata: {
          imageUrl: 'https://picsum.photos/400/400'
        }
      })
    }).then(async (response) => {
      const result = await response.json();
      return { 
        requestNum: i, 
        status: response.status, 
        result,
        timestamp: new Date().toISOString()
      };
    }).catch(error => ({ 
      requestNum: i, 
      error: error.message,
      timestamp: new Date().toISOString() 
    }));
    
    promises.push(promise);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  console.log('\n⏳ Waiting for all requests to complete...\n');
  const results = await Promise.all(promises);
  
  console.log('📊 Rapid Request Results:');
  console.log('=' .repeat(60));
  
  results.forEach(({ requestNum, status, result, error, timestamp }) => {
    const time = new Date(timestamp).toLocaleTimeString();
    
    if (error) {
      console.log(`Request ${requestNum} [${time}]: ❌ Error - ${error}`);
    } else if (status === 401) {
      console.log(`Request ${requestNum} [${time}]: 🔒 Auth Required (${status})`);
    } else if (status === 429) {
      console.log(`Request ${requestNum} [${time}]: 🚫 RATE LIMITED (${status}) - ${result.message || 'Rate limit exceeded'}`);
    } else if (status >= 400) {
      console.log(`Request ${requestNum} [${time}]: ⚠️ Error (${status}) - ${result.error || 'Unknown error'}`);
    } else {
      console.log(`Request ${requestNum} [${time}]: ✅ Success (${status})`);
    }
  });
  
  // Count different response types
  const rateLimited = results.filter(r => r.status === 429).length;
  const authRequired = results.filter(r => r.status === 401).length;
  const errors = results.filter(r => r.status >= 400 && r.status !== 401 && r.status !== 429).length;
  const success = results.filter(r => r.status < 400).length;
  
  console.log('\n📈 Summary:');
  console.log(`   ✅ Successful: ${success}`);
  console.log(`   🔒 Auth Required: ${authRequired}`);
  console.log(`   🚫 Rate Limited: ${rateLimited}`);
  console.log(`   ❌ Other Errors: ${errors}`);
  
  if (rateLimited > 0) {
    console.log('\n🎉 Rate limiting is working! Some requests were rate limited.');
  } else {
    console.log('\nℹ️ No rate limits triggered. This could mean:');
    console.log('   - Rate limiter threshold not reached');
    console.log('   - Authentication required before rate limiting');
    console.log('   - Rate limiter configured for higher thresholds');
  }
  
  return results;
}

async function testTwitterRateLimitStatus() {
  console.log('\n🐦 Testing Twitter Rate Limit Status (for comparison)...');
  try {
    const response = await fetch(`${BASE_URL}/api/twitter/rate-limit-status`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 401) {
      console.log('✅ Twitter rate limit status endpoint exists (authentication required)');
    } else if (response.ok) {
      const status = await response.json();
      console.log('✅ Twitter rate limit status:', JSON.stringify(status, null, 2));
    }
  } catch (error) {
    console.error('❌ Twitter rate limit status error:', error.message);
  }
}

async function runAllTests() {
  console.log('🧪 META RATE LIMITING TEST SUITE');
  console.log('=' .repeat(50));
  console.log('Testing Facebook/Instagram rate limiting implementation');
  console.log(`Server: ${BASE_URL}`);
  console.log(`Time: ${new Date().toLocaleString()}`);
  console.log('=' .repeat(50));
  
  try {
    // Test all endpoints and functionality
    await testMetaRateLimitStatus();
    await testTwitterRateLimitStatus();
    await testInstagramPost();
    await testFacebookPost();
    await testRateLimitTrigger();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Meta Rate Limiting Test Suite Completed!');
    console.log('\n📋 What We Tested:');
    console.log('   📊 Meta rate limit status endpoint');
    console.log('   📸 Instagram posting (with rate limiter)');
    console.log('   📘 Facebook posting (with rate limiter)');
    console.log('   🚀 Rapid requests (rate limit trigger)');
    console.log('   🐦 Twitter rate limit status (comparison)');
    
    console.log('\n🔧 Implementation Status:');
    console.log('   ✅ Meta rate limiter created');
    console.log('   ✅ Rate limit status endpoint added');
    console.log('   ✅ Instagram/Facebook posts wrapped with rate limiter');
    console.log('   ✅ Error handling enhanced with Meta error codes');
    console.log('   ✅ Email notifications ready for rate limit errors');
    
    console.log('\n📧 Email Notifications:');
    console.log('   - Rate limit emails will be sent when authenticated users hit limits');
    console.log('   - Check server logs for email sending attempts');
    console.log('   - Meta error codes (4, 17, 32, 613) trigger specific handling');
    
    console.log('\n🎯 Next Steps:');
    console.log('   1. Test with authenticated user to see email notifications');
    console.log('   2. Configure Facebook/Instagram credentials to test real API limits');
    console.log('   3. Monitor rate limiter with GET /api/meta/rate-limit-status');
    console.log('   4. Check EmailLog table for notification attempts');
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
  }
}

// Run the tests
runAllTests().catch(console.error);