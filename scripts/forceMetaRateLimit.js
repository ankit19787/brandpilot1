/**
 * Simple Meta Rate Limit Trigger Test
 * Creates a scenario where rate limits are definitely hit
 */

const fetch = (await import('node-fetch')).default;

const BASE_URL = 'http://localhost:3001';
let authToken = null;

console.log('\n🔥 FORCING META RATE LIMIT TRIGGER\n');

// Login first
async function login() {
  const response = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  const data = await response.json();
  authToken = data.token;
  console.log('✅ Logged in');
}

// Force rate limit by manipulating the rate limiter directly
async function forceRateLimit() {
  console.log('🎯 Forcing rate limit trigger...');
  
  try {
    // Import and manipulate the rate limiter
    const { default: metaRateLimiter } = await import('./services/metaRateLimiter.js');
    
    // Set the rate limit manually to trigger immediately
    metaRateLimiter.rateLimitResetTime = Date.now() + (30 * 60 * 1000); // 30 minutes from now
    metaRateLimiter.usageData = {
      callCount: 200,
      totalCpuTime: 100,
      totalTime: 3600,
      estimatedTimeToRegain: 30
    };
    
    console.log('✅ Rate limit state forced');
    console.log('📊 Status:', metaRateLimiter.getStatus());
    
    return true;
  } catch (error) {
    console.error('❌ Failed to force rate limit:', error.message);
    return false;
  }
}

// Test posting after rate limit is active
async function testPostAfterRateLimit() {
  console.log('\n📧 Testing post with active rate limit (should trigger email)...');
  
  const response = await fetch(`${BASE_URL}/api/publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      platform: 'Instagram',
      content: 'Rate limit test post - should fail and send email',
      metadata: {
        userId: 'test-user-id',
        imageUrl: 'https://picsum.photos/400/400'
      }
    })
  });
  
  const data = await response.json();
  
  if (response.status === 429) {
    console.log('🎯 SUCCESS! Rate limit triggered:');
    console.log('   Status:', response.status);
    console.log('   Message:', data.message);
    console.log('   Rate limit info:', data.rateLimitInfo);
    console.log('   Credits refunded:', data.refunded);
    console.log('\n📧 Check your email for rate limit notification!');
    return true;
  } else {
    console.log('❌ Expected rate limit, but got:', response.status, data);
    return false;
  }
}

// Check rate limit status
async function checkStatus() {
  const response = await fetch(`${BASE_URL}/api/meta/rate-limit-status`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  const status = await response.json();
  
  console.log('\n📊 Meta Rate Limit Status:');
  console.log('   Rate Limit Active:', status.rateLimitActive);
  console.log('   Queue Length:', status.queueLength);
  console.log('   Request Count:', `${status.requestCount}/${status.maxRequests}`);
  console.log('   Reset Time:', status.rateLimitResetTime);
  console.log('   Usage Data:', status.usageData);
}

// Main execution
async function main() {
  try {
    await login();
    await checkStatus();
    await forceRateLimit();
    await checkStatus();
    await testPostAfterRateLimit();
    
    console.log('\n🎉 Rate limit trigger test complete!');
    console.log('\n🔍 Things to verify:');
    console.log('   1. Check server console for rate limit logs');
    console.log('   2. Check email inbox for rate limit notification');
    console.log('   3. Verify EmailLog table has new entry');
    console.log('   4. Confirm credits were refunded');
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

main();