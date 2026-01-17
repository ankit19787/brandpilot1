/**
 * Quick test script for OAuth 2.0 functionality
 * Tests both OAuth 2.0 and OAuth 1.0a with fallback
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

async function getConfig(token, key) {
  const response = await fetch(`${API_URL}/api/config/${key}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) return null;
  const data = await response.json();
  return data.value;
}

async function testOAuth2() {
  try {
    const token = await login();
    
    // Check current auth method
    console.log('📊 Current Twitter Configuration:');
    const authMethod = await getConfig(token, 'twitter_auth_method');
    const oauth2Token = await getConfig(token, 'x_oauth2_access_token');
    const oauth1Key = await getConfig(token, 'x_api_key');
    
    console.log(`   Auth Method: ${authMethod || 'oauth1 (default)'}`);
    console.log(`   OAuth 2.0 Token: ${oauth2Token ? oauth2Token.substring(0, 15) + '...' : '(not configured)'}`);
    console.log(`   OAuth 1.0a Key: ${oauth1Key ? oauth1Key.substring(0, 15) + '...' : '(not configured)'}`);
    console.log('');
    
    // Test posting with current configuration
    console.log('🧪 Testing Tweet Post with Current Auth...');
    const tweetText = `Test tweet ${new Date().getTime()} - Testing dual auth support`;
    
    const response = await fetch(`${API_URL}/api/twitter/post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ text: tweetText })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Tweet posted successfully!');
      console.log(`   Tweet ID: ${result.data?.id || 'N/A'}`);
      console.log(`   Auth Method Used: ${result.authMethod || 'unknown'}`);
      console.log(`   Text: ${result.data?.text || tweetText}`);
      
      if (result.authMethod === 'oauth2') {
        console.log('\n🎉 SUCCESS! Using OAuth 2.0 (100 tweets/day limit)');
      } else if (result.authMethod === 'oauth1') {
        console.log('\n⚠️  Using OAuth 1.0a (50 tweets/day limit)');
        console.log('   💡 Tip: Configure OAuth 2.0 for 2x the rate limit!');
      }
    } else {
      console.error('❌ Tweet failed:');
      console.error(`   Status: ${response.status}`);
      console.error(`   Error: ${result.error || result.detail}`);
      
      if (result.error?.includes('credentials not configured')) {
        console.log('\n⚠️  Twitter credentials not configured!');
        console.log('   Run: npm run check:config');
        console.log('   Or: npm run config:twitter:oauth2');
      }
    }
    
    console.log('\n📊 Rate Limit Info:');
    console.log('   OAuth 1.0a (Free): 50 tweets/day');
    console.log('   OAuth 2.0 (Free):  100 tweets/day ⭐');
    console.log('   OAuth 2.0 (Basic): Unlimited');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run test
console.log('🐦 Twitter OAuth 2.0 Test\n');
testOAuth2();
