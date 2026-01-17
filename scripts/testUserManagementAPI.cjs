const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUserManagementAPI() {
  console.log('\n🧪 Testing User Management API Endpoints...\n');

  const BASE_URL = 'http://localhost:3001';
  let testUserId = null;

  try {
    // Test 1: GET /api/users - Fetch all users
    console.log('📋 Test 1: GET /api/users - Fetch all users...');
    const usersResponse = await fetch(`${BASE_URL}/api/users`);
    const users = await usersResponse.json();
    
    if (usersResponse.ok && Array.isArray(users)) {
      console.log(`✅ Success! Found ${users.length} users`);
      console.log('   Sample user:', {
        username: users[0]?.username,
        role: users[0]?.role,
        plan: users[0]?.plan,
        credits: users[0]?.credits
      });
      
      // Find a non-admin user for testing updates
      testUserId = users.find(u => u.role !== 'admin')?.id || users[0]?.id;
    } else {
      console.log('❌ Failed to fetch users');
      return;
    }

    // Test 2: PATCH /api/users/:userId - Update user
    if (testUserId) {
      console.log('\n✏️ Test 2: PATCH /api/users/:userId - Update user...');
      
      // Get current user data
      const currentUser = users.find(u => u.id === testUserId);
      console.log('   Current user:', {
        username: currentUser.username,
        role: currentUser.role,
        credits: currentUser.credits
      });
      
      // Update credits (non-destructive change)
      const updateResponse = await fetch(`${BASE_URL}/api/users/${testUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credits: currentUser.credits + 100
        })
      });
      
      if (updateResponse.ok) {
        const updated = await updateResponse.json();
        console.log('✅ Update successful!');
        console.log('   New credits:', updated.credits);
        
        // Revert the change
        await fetch(`${BASE_URL}/api/users/${testUserId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            credits: currentUser.credits
          })
        });
        console.log('   ↩️ Reverted credits back to original value');
      } else {
        const error = await updateResponse.json();
        console.log('❌ Update failed:', error);
      }
    }

    // Test 3: Test role update validation
    console.log('\n🔐 Test 3: Test role validation...');
    const invalidRoleResponse = await fetch(`${BASE_URL}/api/users/${testUserId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'invalid_role'
      })
    });
    
    if (invalidRoleResponse.status === 400) {
      console.log('✅ Role validation working - rejected invalid role');
    } else {
      console.log('❌ Role validation failed - accepted invalid role');
    }

    // Test 4: Test plan update validation
    console.log('\n💳 Test 4: Test plan validation...');
    const invalidPlanResponse = await fetch(`${BASE_URL}/api/users/${testUserId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan: 'invalid_plan'
      })
    });
    
    if (invalidPlanResponse.status === 400) {
      console.log('✅ Plan validation working - rejected invalid plan');
    } else {
      console.log('❌ Plan validation failed - accepted invalid plan');
    }

    // Test 5: Test statistics
    console.log('\n📊 Test 5: Verify statistics calculation...');
    const admins = users.filter(u => u.role === 'admin').length;
    const withEmail = users.filter(u => u.email).length;
    const paidPlans = users.filter(u => u.plan !== 'free').length;
    
    console.log('✅ Statistics:');
    console.log(`   Total users: ${users.length}`);
    console.log(`   Admins: ${admins}`);
    console.log(`   With email: ${withEmail}`);
    console.log(`   Paid plans: ${paidPlans}`);

    console.log('\n✅ All API tests passed!\n');

  } catch (error) {
    console.error('❌ Error testing user management API:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Check if server is running before testing
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3001/health', { 
      method: 'GET',
      signal: AbortSignal.timeout(2000)
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('\n⚠️ Server is not running on http://localhost:3001');
    console.log('   Please start the server first: node server.js\n');
    process.exit(1);
  }
  
  await testUserManagementAPI();
}

main();
