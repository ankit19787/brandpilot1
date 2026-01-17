/**
 * Test Twitter Rate Limiter
 * Simulates multiple requests to test queue and rate limiting
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001';

async function login() {
  console.log('🔐 Logging in...');
  const response = await fetch(`${API_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123'
    })
  });
  
  const data = await response.json();
  if (!data.token) {
    throw new Error('Login failed');
  }
  
  console.log('✅ Logged in successfully\n');
  return data.token;
}

async function getRateLimitStatus(token) {
  const response = await fetch(`${API_URL}/api/twitter/rate-limit-status`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
}

async function postTweet(token, text, priority = 0) {
  const response = await fetch(`${API_URL}/api/twitter/post`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ text, priority })
  });
  
  const data = await response.json();
  return { status: response.status, data };
}

async function testRateLimiter() {
  try {
    const token = await login();
    
    console.log('📊 Initial Rate Limit Status:');
    let status = await getRateLimitStatus(token);
    console.log(status);
    console.log('');
    
    // Test 1: Send multiple tweets in quick succession
    console.log('🧪 Test 1: Sending 5 tweets rapidly...');
    const tweets = [
      { text: 'Test tweet 1 - Normal priority', priority: 0 },
      { text: 'Test tweet 2 - Normal priority', priority: 0 },
      { text: 'URGENT: Test tweet 3 - HIGH PRIORITY', priority: 10 },
      { text: 'Test tweet 4 - Normal priority', priority: 0 },
      { text: 'Test tweet 5 - Normal priority', priority: 0 }
    ];
    
    const promises = tweets.map((tweet, index) => 
      postTweet(token, tweet.text, tweet.priority)
        .then(result => {
          console.log(`✅ Tweet ${index + 1}: ${result.status === 201 ? 'Posted' : 'Queued'}`);
          if (result.status === 429) {
            console.log(`   Queue position: ${result.data.queuePosition}`);
          }
          return result;
        })
        .catch(err => {
          console.error(`❌ Tweet ${index + 1}: Error -`, err.message);
        })
    );
    
    await Promise.all(promises);
    console.log('');
    
    // Test 2: Check queue status
    console.log('📊 Rate Limit Status After Burst:');
    status = await getRateLimitStatus(token);
    console.log(status);
    console.log('');
    
    // Test 3: Monitor queue processing
    if (status.queueLength > 0) {
      console.log('⏳ Monitoring queue processing...');
      let iterations = 0;
      const maxIterations = 10;
      
      while (iterations < maxIterations) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        status = await getRateLimitStatus(token);
        
        console.log(`Queue: ${status.queueLength} | Made: ${status.requestsMade}/${status.requestsMade + status.remainingRequests}`);
        
        if (status.queueLength === 0) {
          console.log('✅ Queue cleared!');
          break;
        }
        
        iterations++;
      }
    }
    
    console.log('\n📊 Final Status:');
    status = await getRateLimitStatus(token);
    console.log(status);
    
    console.log('\n✅ Rate limiter test completed!');
    console.log('\n💡 Tips:');
    console.log('   - Requests are automatically queued when rate limit is hit');
    console.log('   - High priority tweets (priority > 0) are processed first');
    console.log('   - Self-imposed limit: 50 requests per 15 minutes');
    console.log('   - Automatic retry with exponential backoff');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run test
testRateLimiter();
