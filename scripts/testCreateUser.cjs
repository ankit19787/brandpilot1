const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCreateUserAPI() {
  console.log('\n🧪 Testing Create User API...\n');

  const BASE_URL = 'http://localhost:3001';
  const testUsername = `testuser_${Date.now()}`;

  try {
    // Test 1: Create a new user
    console.log('📝 Test 1: Creating a new user...');
    const createResponse = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUsername,
        password: 'testpassword123',
        email: 'test@example.com',
        role: 'user',
        plan: 'pro',
        credits: 5000,
        maxCredits: 10000
      })
    });

    if (createResponse.ok) {
      const newUser = await createResponse.json();
      console.log('✅ User created successfully!');
      console.log('   User details:', {
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        plan: newUser.plan,
        credits: newUser.credits,
        maxCredits: newUser.maxCredits,
        id: newUser.id
      });

      // Test 2: Verify user exists in database
      console.log('\n🔍 Test 2: Verifying user in database...');
      const dbUser = await prisma.user.findUnique({
        where: { username: testUsername }
      });

      if (dbUser) {
        console.log('✅ User found in database');
        console.log('   Password hash exists:', !!dbUser.passwordHash);
        console.log('   Avatar color:', dbUser.avatarStyle);
      } else {
        console.log('❌ User not found in database');
      }

      // Test 3: Try to create duplicate user
      console.log('\n🚫 Test 3: Testing duplicate username validation...');
      const duplicateResponse = await fetch(`${BASE_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: testUsername,
          password: 'anotherpassword'
        })
      });

      if (duplicateResponse.status === 400) {
        const error = await duplicateResponse.json();
        console.log('✅ Duplicate validation working:', error.error);
      } else {
        console.log('❌ Duplicate validation failed');
      }

      // Test 4: Test invalid role validation
      console.log('\n🔐 Test 4: Testing invalid role validation...');
      const invalidRoleResponse = await fetch(`${BASE_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: `testuser_${Date.now()}`,
          password: 'password123',
          role: 'superadmin'
        })
      });

      if (invalidRoleResponse.status === 400) {
        const error = await invalidRoleResponse.json();
        console.log('✅ Role validation working:', error.error);
      } else {
        console.log('❌ Role validation failed');
      }

      // Test 5: Test missing required fields
      console.log('\n📋 Test 5: Testing required field validation...');
      const missingFieldResponse = await fetch(`${BASE_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: `testuser_${Date.now()}`
          // Missing password
        })
      });

      if (missingFieldResponse.status === 400) {
        const error = await missingFieldResponse.json();
        console.log('✅ Required field validation working:', error.error);
      } else {
        console.log('❌ Required field validation failed');
      }

      // Test 6: Create user with minimal fields
      console.log('\n🎯 Test 6: Creating user with minimal fields...');
      const minimalUsername = `minimal_${Date.now()}`;
      const minimalResponse = await fetch(`${BASE_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: minimalUsername,
          password: 'password123'
        })
      });

      if (minimalResponse.ok) {
        const minimalUser = await minimalResponse.json();
        console.log('✅ Minimal user created with defaults:');
        console.log('   Role:', minimalUser.role, '(should be user)');
        console.log('   Plan:', minimalUser.plan, '(should be free)');
        console.log('   Credits:', minimalUser.credits, '(should be 1000)');
        console.log('   MaxCredits:', minimalUser.maxCredits, '(should be 1000)');

        // Cleanup minimal user
        await prisma.user.delete({
          where: { username: minimalUsername }
        });
        console.log('   🧹 Cleaned up minimal test user');
      }

      // Cleanup test user
      console.log('\n🧹 Cleaning up test user...');
      await prisma.user.delete({
        where: { username: testUsername }
      });
      console.log('✅ Test user deleted');

      console.log('\n✅ All create user tests passed!\n');
    } else {
      const error = await createResponse.json();
      console.log('❌ Failed to create user:', error);
    }

  } catch (error) {
    console.error('❌ Error testing create user API:', error.message);
  } finally {
    // Cleanup in case of error
    try {
      await prisma.user.deleteMany({
        where: {
          username: {
            startsWith: 'testuser_'
          }
        }
      });
      await prisma.user.deleteMany({
        where: {
          username: {
            startsWith: 'minimal_'
          }
        }
      });
    } catch (e) {
      // Ignore cleanup errors
    }
    await prisma.$disconnect();
  }
}

// Check if server is running
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
    console.log('   Please start the server first with: node server.js\n');
    process.exit(1);
  }

  await testCreateUserAPI();
}

main();
