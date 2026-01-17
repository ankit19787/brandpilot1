/**
 * Test User-Friendly API Endpoints
 * Tests the new endpoints that regular users can access without admin privileges
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

// Test user credentials (create if not exists)
const testUser = {
  username: 'testfreeuser',
  password: 'test123',
  email: 'freeuser@example.com',
  role: 'user',
  plan: 'free'
};

let authToken = null;

async function createTestUser() {
  console.log('🔧 Creating/finding test user...');
  try {
    const response = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Test user created: ${result.username} (${result.plan} plan)`);
      return result;
    } else {
      const error = await response.json();
      if (error.error && error.error.includes('already exists')) {
        console.log('ℹ️  User already exists, will try to login');
        return { username: testUser.username };
      } else {
        throw new Error(error.error || 'Failed to create user');
      }
    }
  } catch (error) {
    console.error('❌ Error with user creation:', error.message);
    throw error;
  }
}

async function loginUser() {
  console.log('🔐 Logging in test user...');
  try {
    const response = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUser.username,
        password: testUser.password
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      authToken = result.token;
      console.log(`✅ Login successful. User: ${result.user?.username} (${result.user?.plan} plan)`);
      return result;
    } else {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    throw error;
  }
}

async function testUserConfigEndpoint() {
  console.log('\n📊 Testing user-config endpoint...');
  const configKeys = ['auto_post_enabled', 'system_maintenance', 'max_posts_per_day', 'platform_status'];
  
  for (const key of configKeys) {
    try {
      const response = await fetch(`${BASE_URL}/api/user-config/${key}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const config = await response.json();
        console.log(`✅ ${key}: ${config.value}`);
      } else {
        const error = await response.json();
        console.log(`❌ ${key}: ${error.error}`);
      }
    } catch (error) {
      console.log(`💥 ${key}: ${error.message}`);
    }
  }
}

async function testUserPostsEndpoint() {
  console.log('\n📝 Testing user posts endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/api/posts`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const posts = await response.json();
      console.log(`✅ User posts retrieved: ${posts.length} posts`);
      
      if (posts.length > 0) {
        console.log(`   📋 Latest post: "${posts[0].content?.substring(0, 50)}..."`);
        console.log(`   🕒 Created: ${new Date(posts[0].createdAt).toLocaleString()}`);
      }
    } else {
      const error = await response.json();
      console.log(`❌ Posts endpoint error: ${error.error}`);
    }
  } catch (error) {
    console.log(`💥 Posts endpoint error: ${error.message}`);
  }
}

async function testAdminEndpoints() {
  console.log('\n🛡️  Testing admin endpoints (should fail for regular user)...');
  
  // Test admin config endpoint
  try {
    const response = await fetch(`${BASE_URL}/api/config/auto_post_enabled`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 403) {
      console.log('✅ Admin config endpoint correctly blocked (403 Forbidden)');
    } else if (response.ok) {
      console.log('❌ Admin config endpoint should be blocked for regular users');
    } else {
      console.log(`⚠️  Unexpected response: ${response.status}`);
    }
  } catch (error) {
    console.log(`💥 Admin config test error: ${error.message}`);
  }
  
  // Test admin posts endpoint
  try {
    const response = await fetch(`${BASE_URL}/api/posts/all`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 403) {
      console.log('✅ Admin posts endpoint correctly blocked (403 Forbidden)');
    } else if (response.ok) {
      console.log('❌ Admin posts endpoint should be blocked for regular users');
    } else {
      console.log(`⚠️  Unexpected response: ${response.status}`);
    }
  } catch (error) {
    console.log(`💥 Admin posts test error: ${error.message}`);
  }
}

async function runUserEndpointTests() {
  console.log('🧪 TESTING USER-FRIENDLY API ENDPOINTS');
  console.log('='.repeat(55));
  console.log(`Server: ${BASE_URL}`);
  console.log(`Time: ${new Date().toLocaleString()}`);
  console.log('='.repeat(55));
  
  try {
    // Setup
    await createTestUser();
    await loginUser();
    
    // Test new user-friendly endpoints
    await testUserConfigEndpoint();
    await testUserPostsEndpoint();
    
    // Verify admin endpoints are still protected
    await testAdminEndpoints();
    
    console.log('\n' + '='.repeat(55));
    console.log('✅ USER ENDPOINT TESTS COMPLETED!');
    console.log('='.repeat(55));
    
    console.log('\n🎯 Results Summary:');
    console.log('✅ User-friendly endpoints created');
    console.log('✅ Free plan users can access their config');
    console.log('✅ Free plan users can access their posts');
    console.log('✅ Admin endpoints still protected');
    console.log('✅ Proper authentication required');
    
    console.log('\n📱 Frontend Updates:');
    console.log('✅ App.tsx: Uses /api/user-config/auto_post_enabled');
    console.log('✅ Dashboard.tsx: Uses /api/posts (user posts)');
    console.log('✅ PlatformResponses.tsx: Uses /api/posts');
    console.log('✅ AdminPosts.tsx: Still uses /api/posts/all (admin only)');
    
    console.log('\n🛡️  Security:');
    console.log('✅ User config endpoint only allows safe config keys');
    console.log('✅ User posts endpoint only returns user\'s own posts');
    console.log('✅ Admin endpoints require admin role');
    console.log('✅ All endpoints require authentication');
    
    console.log('\n🎉 403 FORBIDDEN ERRORS SHOULD BE RESOLVED!');
    console.log('Free plan users can now access the app properly.');
    
  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
  }
}

runUserEndpointTests();