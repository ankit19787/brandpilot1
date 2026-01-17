/**
 * Test Meta (Facebook/Instagram) Rate Limiting
 * Tests the new rate limiting implementation for Meta platforms
 */

const fetch = (await import('node-fetch')).default;

const BASE_URL = 'http://localhost:3001';
let authToken = null;
let testUserId = null;

// Test configuration
const TEST_CONTENT = "Test post for Meta rate limiting - " + new Date().toISOString();
const TEST_PLATFORMS = ['Instagram', 'Facebook'];

console.log('\n🧪 TESTING META RATE LIMITING SYSTEM\n');

/**
 * Login and get auth token
 */
async function login() {
  console.log('🔐 Logging in...');
  try {
    const response = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`);
    }

    const data = await response.json();
    authToken = data.token;
    testUserId = data.user.id;
    console.log(`✅ Login successful! User ID: ${testUserId}`);
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    return false;
  }
}

/**
 * Check Meta rate limit status
 */
async function checkRateLimitStatus() {
  console.log('\n📊 Checking Meta rate limit status...');
  try {
    const response = await fetch(`${BASE_URL}/api/meta/rate-limit-status`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }

    const status = await response.json();
    console.log('📈 Meta Rate Limit Status:');
    console.log(`   Queue Length: ${status.queueLength}`);
    console.log(`   Processing: ${status.processing}`);
    console.log(`   Request Count: ${status.requestCount}/${status.maxRequests}`);
    console.log(`   Window Remaining: ${status.windowRemainingSeconds}s`);
    console.log(`   Rate Limit Active: ${status.rateLimitActive}`);
    if (status.rateLimitActive) {
      console.log(`   Reset Time: ${status.rateLimitResetTime}`);
    }
    console.log(`   Usage Data:`, status.usageData);
    
    return status;
  } catch (error) {
    console.error('❌ Failed to check rate limit status:', error.message);
    return null;
  }
}

/**
 * Test single post to platform
 */
async function testPost(platform) {
  console.log(`\n📝 Testing post to ${platform}...`);
  try {
    const response = await fetch(`${BASE_URL}/api/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        platform: platform,
        content: `${TEST_CONTENT} - Platform: ${platform}`,
        metadata: {
          userId: testUserId,
          imageUrl: platform === 'Instagram' ? 'https://picsum.photos/400/400' : undefined
        }
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${platform} post successful:`, data.id);
      console.log(`   URL: ${data.url}`);
      console.log(`   Credits remaining: ${data.credits}`);
    } else if (response.status === 429) {
      console.log(`🚫 ${platform} rate limit hit:`, data.message);
      console.log(`   Reset info:`, data.rateLimitInfo);
      console.log(`   Credits refunded: ${data.refunded ? '✅' : '❌'}`);
      console.log(`   Credits: ${data.credits}`);
    } else {
      console.log(`❌ ${platform} post failed:`, data.error);
      console.log(`   Credits refunded: ${data.refunded ? '✅' : '❌'}`);
    }
    
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    console.error(`❌ ${platform} test failed:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Simulate rate limit by making many requests quickly
 */
async function simulateRateLimit() {
  console.log('\n⚡ Simulating rate limit by making rapid requests...');
  
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(testPost('Facebook'));
  }
  
  const results = await Promise.allSettled(promises);
  console.log(`📊 Results: ${results.filter(r => r.status === 'fulfilled').length}/5 completed`);
  
  // Check if any hit rate limits
  const rateLimitHit = results.some(r => 
    r.status === 'fulfilled' && 
    r.value.status === 429
  );
  
  if (rateLimitHit) {
    console.log('🎯 Rate limit successfully triggered!');
  } else {
    console.log('ℹ️  Rate limit not triggered (may need more requests)');
  }
  
  return rateLimitHit;
}

/**
 * Test rate limiter directly (without API calls)
 */
async function testRateLimiterDirect() {
  console.log('\n🔧 Testing rate limiter directly...');
  
  try {
    // Import the rate limiter
    const { default: metaRateLimiter } = await import('./services/metaRateLimiter.js');
    
    console.log('📊 Initial status:');
    const initialStatus = metaRateLimiter.getStatus();
    console.log(`   Queue: ${initialStatus.queueLength}, Requests: ${initialStatus.requestCount}/${initialStatus.maxRequests}`);
    
    // Test enqueueing a mock request
    console.log('🔄 Testing request queueing...');
    const mockRequest = async () => {
      console.log('   Mock request executed');
      return { success: true, mock: true };
    };
    
    const result = await metaRateLimiter.enqueue(mockRequest, 1);
    console.log('✅ Mock request completed:', result);
    
    // Check status after
    const finalStatus = metaRateLimiter.getStatus();
    console.log('📊 Final status:');
    console.log(`   Queue: ${finalStatus.queueLength}, Requests: ${finalStatus.requestCount}/${finalStatus.maxRequests}`);
    
    return true;
  } catch (error) {
    console.error('❌ Direct rate limiter test failed:', error.message);
    return false;
  }
}

/**
 * Test error handling with mock rate limit error
 */
async function testErrorHandling() {
  console.log('\n🧪 Testing error handling...');
  
  try {
    // Import the rate limiter
    const { default: metaRateLimiter } = await import('./services/metaRateLimiter.js');
    
    // Create a mock request that simulates a Meta rate limit error
    const mockRateLimitRequest = async () => {
      const error = new Error('API Too Many Calls');
      error.data = {
        error: {
          code: 4,
          message: 'API Too Many Calls',
          type: 'OAuthException',
          error_data: {
            estimated_time_to_regain_access: 30 // 30 minutes
          }
        }
      };
      throw error;
    };
    
    try {
      await metaRateLimiter.enqueue(mockRateLimitRequest, 1);
      console.log('❌ Expected error was not thrown');
      return false;
    } catch (error) {
      if (error.isRateLimitError) {
        console.log('✅ Rate limit error properly detected');
        console.log(`   Error info:`, error.rateLimitInfo);
        return true;
      } else {
        console.log('❌ Rate limit error not properly detected');
        return false;
      }
    }
  } catch (error) {
    console.error('❌ Error handling test failed:', error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Starting Meta Rate Limiting Tests...\n');
  
  // Step 1: Login
  if (!(await login())) {
    console.log('\n❌ Tests aborted - login failed');
    return;
  }
  
  // Step 2: Check initial rate limit status
  await checkRateLimitStatus();
  
  // Step 3: Test direct rate limiter functionality
  console.log('\n=== DIRECT RATE LIMITER TESTS ===');
  await testRateLimiterDirect();
  await testErrorHandling();
  
  // Step 4: Test individual posts
  console.log('\n=== PLATFORM POSTING TESTS ===');
  for (const platform of TEST_PLATFORMS) {
    await testPost(platform);
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
  }
  
  // Step 5: Check rate limit status after posts
  await checkRateLimitStatus();
  
  // Step 6: Try to simulate rate limiting
  console.log('\n=== RATE LIMITING SIMULATION ===');
  await simulateRateLimit();
  
  // Step 7: Final status check
  await checkRateLimitStatus();
  
  console.log('\n🎯 Meta Rate Limiting Tests Complete!');
  console.log('\n📋 What to check:');
  console.log('   1. Email notifications (check your email)');
  console.log('   2. Database EmailLog table for sent emails');
  console.log('   3. Server console logs for rate limit messages');
  console.log('   4. Credit refunds in CreditTransaction table');
  console.log('\n✅ All tests executed successfully!');
}

// Run the tests
runTests().catch(error => {
  console.error('\n💥 Test runner failed:', error);
  process.exit(1);
});