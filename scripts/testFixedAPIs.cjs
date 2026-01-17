// Test the fixed API endpoints
const fetch = require('node-fetch');

async function testFixedAPIs() {
  try {
    console.log('🧪 Testing Fixed API Endpoints...\n');
    
    const userId = '4520e145-c52d-4103-84f5-4c88e1ecd619'; // admin user
    
    // Test 1: GET Brand DNA (should work now)
    console.log('1️⃣ Testing GET /api/brand-dna/:userId');
    try {
      const response = await fetch(`http://localhost:3001/api/brand-dna/${userId}`);
      console.log(`   Status: ${response.status}`);
      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ Success - Brand DNA found');
      } else {
        console.log('   ℹ️  No Brand DNA found (this is normal if none exists)');
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Test 2: GET Content Strategy 
    console.log('\n2️⃣ Testing GET /api/content-strategy/:userId');
    try {
      const response = await fetch(`http://localhost:3001/api/content-strategy/${userId}`);
      console.log(`   Status: ${response.status}`);
      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ Success - Content Strategy found');
      } else {
        console.log('   ℹ️  No Content Strategy found (this is normal if none exists)');
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Test 3: GET Monetization Plan
    console.log('\n3️⃣ Testing GET /api/monetization-plan/:userId');
    try {
      const response = await fetch(`http://localhost:3001/api/monetization-plan/${userId}`);
      console.log(`   Status: ${response.status}`);
      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ Success - Monetization Plan found');
      } else {
        console.log('   ℹ️  No Monetization Plan found (this is normal if none exists)');
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Test 4: Test connection endpoint
    console.log('\n4️⃣ Testing /api/test-connection');
    try {
      const response = await fetch('http://localhost:3001/api/test-connection');
      console.log(`   Status: ${response.status}`);
      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ Success - Backend connection working');
      } else {
        console.log('   ❌ Connection test failed');
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('\n🎉 API endpoint tests completed!');
    console.log('\n💡 The frontend should now make requests to:');
    console.log('   ✅ http://localhost:3001/api/brand-dna/:userId');
    console.log('   ✅ http://localhost:3001/api/content-strategy/:userId');
    console.log('   ✅ http://localhost:3001/api/monetization-plan/:userId');
    console.log('   Instead of the incorrect URLs missing /api');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFixedAPIs();