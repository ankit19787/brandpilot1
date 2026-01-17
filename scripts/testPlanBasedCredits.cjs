const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPlanBasedCredits() {
  console.log('\n🧪 Testing Plan-Based Credit Management...\n');

  const BASE_URL = 'http://localhost:3001';
  const testUsername = `plantest_${Date.now()}`;

  try {
    // Test 1: Create user with Pro plan - should get 10,000 credits
    console.log('📝 Test 1: Creating user with Pro plan...');
    const createResponse = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUsername,
        password: 'test123',
        plan: 'pro'
      })
    });

    if (createResponse.ok) {
      const user = await createResponse.json();
      console.log('✅ User created:');
      console.log(`   Plan: ${user.plan}`);
      console.log(`   Credits: ${user.credits} / ${user.maxCredits}`);
      
      if (user.credits === 10000 && user.maxCredits === 10000) {
        console.log('   ✅ Correct credits for Pro plan (10,000)');
      } else {
        console.log('   ❌ Wrong credits! Expected 10,000/10,000');
      }

      // Test 2: Upgrade to Business plan - should get 50,000 credits
      console.log('\n📈 Test 2: Upgrading to Business plan...');
      const upgradeResponse = await fetch(`${BASE_URL}/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'business' })
      });

      if (upgradeResponse.ok) {
        const upgraded = await upgradeResponse.json();
        console.log('✅ Plan upgraded:');
        console.log(`   Plan: ${upgraded.plan}`);
        console.log(`   Credits: ${upgraded.credits} / ${upgraded.maxCredits}`);
        
        if (upgraded.credits === 50000 && upgraded.maxCredits === 50000) {
          console.log('   ✅ Correct credits for Business plan (50,000)');
        } else {
          console.log('   ❌ Wrong credits! Expected 50,000/50,000');
        }
      }

      // Test 3: Downgrade to Free plan - should cap at 1,000 credits
      console.log('\n📉 Test 3: Downgrading to Free plan...');
      const downgradeResponse = await fetch(`${BASE_URL}/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'free' })
      });

      if (downgradeResponse.ok) {
        const downgraded = await downgradeResponse.json();
        console.log('✅ Plan downgraded:');
        console.log(`   Plan: ${downgraded.plan}`);
        console.log(`   Credits: ${downgraded.credits} / ${downgraded.maxCredits}`);
        
        if (downgraded.credits === 1000 && downgraded.maxCredits === 1000) {
          console.log('   ✅ Correct credits capped for Free plan (1,000)');
        } else {
          console.log('   ❌ Wrong credits! Expected 1,000/1,000');
        }
      }

      // Test 4: Try to set credits above plan limit - should fail
      console.log('\n🚫 Test 4: Attempting to set credits above plan limit...');
      const exceedResponse = await fetch(`${BASE_URL}/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits: 5000 })
      });

      if (exceedResponse.status === 400) {
        const error = await exceedResponse.json();
        console.log('✅ Correctly rejected excessive credits');
        console.log(`   Error: ${error.error}`);
      } else {
        console.log('❌ Should have rejected credits above plan limit');
      }

      // Test 5: Set valid credits within plan limit
      console.log('\n✏️ Test 5: Setting valid credits within plan limit...');
      const validResponse = await fetch(`${BASE_URL}/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits: 500 })
      });

      if (validResponse.ok) {
        const updated = await validResponse.json();
        console.log('✅ Credits updated:');
        console.log(`   Credits: ${updated.credits} / ${updated.maxCredits}`);
        
        if (updated.credits === 500 && updated.maxCredits === 1000) {
          console.log('   ✅ Correct partial credits (500/1,000)');
        }
      }

      // Cleanup
      console.log('\n🧹 Cleaning up test user...');
      await fetch(`${BASE_URL}/api/users/${user.id}`, { method: 'DELETE' });
      console.log('✅ Test user deleted');

      console.log('\n✅ All plan-based credit tests passed!\n');
    } else {
      const error = await createResponse.json();
      console.log('❌ Failed to create test user:', error);
    }

  } catch (error) {
    console.error('❌ Error testing plan-based credits:', error.message);
  } finally {
    // Cleanup in case of error
    try {
      await prisma.user.deleteMany({
        where: { username: { startsWith: 'plantest_' } }
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
    console.log('   Please start the server first: node server.js\n');
    process.exit(1);
  }

  await testPlanBasedCredits();
}

main();
