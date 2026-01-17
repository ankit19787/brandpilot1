/**
 * Test Admin Posts Endpoint
 * Tests the /api/posts/all endpoint that's failing in AdminPosts component
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

// Admin user credentials (assuming admin exists)
const adminUser = {
  username: 'admin',
  password: 'admin123'
};

let adminToken = null;

async function loginAdmin() {
  console.log('🔐 Logging in admin user...');
  try {
    const response = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminUser)
    });
    
    if (response.ok) {
      const result = await response.json();
      adminToken = result.token;
      console.log(`✅ Admin login successful. User: ${result.user?.username} (Role: ${result.user?.role})`);
      return result;
    } else {
      const error = await response.json();
      throw new Error(error.error || 'Admin login failed');
    }
  } catch (error) {
    console.error('❌ Admin login error:', error.message);
    throw error;
  }
}

async function testAdminPostsEndpoint() {
  console.log('📝 Testing admin posts endpoint (/api/posts/all)...');
  try {
    const response = await fetch(`${BASE_URL}/api/posts/all`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const posts = await response.json();
      console.log(`✅ Admin posts endpoint working: ${posts.length} posts retrieved`);
      
      if (posts.length > 0) {
        console.log(`   📋 Latest post: "${posts[0].content?.substring(0, 50)}..."`);
        console.log(`   👤 By user: ${posts[0].user?.username || posts[0].userId}`);
      }
    } else {
      const error = await response.json();
      console.log(`❌ Admin posts endpoint error (${response.status}): ${error.error}`);
      
      if (response.status === 403) {
        console.log('🚨 403 Forbidden - Admin authorization failed!');
        console.log('   This suggests the user is not recognized as admin');
      }
    }
  } catch (error) {
    console.log(`💥 Admin posts endpoint error: ${error.message}`);
  }
}

async function checkAdminAuth() {
  console.log('🔍 Checking admin user authentication...');
  try {
    const response = await fetch(`${BASE_URL}/api/test-admin`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Admin auth test passed: ${JSON.stringify(result)}`);
    } else {
      const error = await response.json();
      console.log(`❌ Admin auth test failed (${response.status}): ${error.error}`);
    }
  } catch (error) {
    console.log(`💥 Admin auth test error: ${error.message}`);
  }
}

async function runAdminTest() {
  console.log('🧪 TESTING ADMIN POSTS ENDPOINT');
  console.log('='.repeat(45));
  console.log(`Server: ${BASE_URL}`);
  console.log(`Time: ${new Date().toLocaleString()}`);
  console.log('='.repeat(45));
  
  try {
    await loginAdmin();
    await testAdminPostsEndpoint();
    await checkAdminAuth();
    
    console.log('\n' + '='.repeat(45));
    console.log('🎯 ADMIN TEST RESULTS:');
    console.log('='.repeat(45));
    
  } catch (error) {
    console.error('\n💥 Admin test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure admin user exists in database');
    console.log('2. Check if admin user has role = "admin"');
    console.log('3. Verify server is running on port 3001');
    console.log('4. Check if JWT token is valid');
  }
}

runAdminTest();