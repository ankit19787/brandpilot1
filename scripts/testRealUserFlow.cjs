// Simulate real user flow for monetization feature
const fetch = require('node-fetch');

async function testRealUserFlow() {
  try {
    console.log('🧪 Testing Real User Monetization Flow...\n');
    
    // 1. Simulate login and get a real user token
    console.log('1️⃣ Attempting to login as testuser...');
    const loginResponse = await fetch('http://localhost:3001/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        password: 'password123'
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed:', await loginResponse.text());
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful, token received');
    
    // 2. Validate the token to get user details
    console.log('\n2️⃣ Validating token and getting user details...');
    const validateResponse = await fetch('http://localhost:3001/api/validate-token', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.token}`
      }
    });
    
    if (!validateResponse.ok) {
      console.log('❌ Token validation failed:', await validateResponse.text());
      return;
    }
    
    const userData = await validateResponse.json();
    console.log(`✅ User validated: ${userData.user.username} (ID: ${userData.user.id})`);
    console.log(`   Plan: ${userData.user.plan}, Credits: ${userData.user.credits}`);
    
    const userId = userData.user.id;
    
    // 3. Test monetization plan generation with real user ID
    console.log('\n3️⃣ Testing monetization plan generation with real user ID...');
    const testDNA = {
      voice: "Professional and engaging",
      personality: "Expert, approachable, and helpful",
      contentPillars: ["Technology", "Innovation", "Growth"],
      audienceType: "Tech professionals and entrepreneurs",
      writingStyle: "Clear, engaging, and informative"
    };
    
    const monetizationResponse = await fetch('http://localhost:3001/api/monetization-plan', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.token}` // Add auth header
      },
      body: JSON.stringify({
        dna: testDNA,
        metrics: { currentFollowers: 25000, engagement: 4.8 },
        userId: userId
      })
    });
    
    if (!monetizationResponse.ok) {
      const errorText = await monetizationResponse.text();
      console.log(`❌ Monetization API failed: ${monetizationResponse.status} - ${errorText}`);
      return;
    }
    
    const monetizationResult = await monetizationResponse.json();
    console.log(`✅ Monetization plan generated successfully - ${monetizationResult.length} ideas`);
    
    // 4. Test retrieving the saved plan
    console.log('\n4️⃣ Testing retrieval of saved monetization plan...');
    const getResponse = await fetch(`http://localhost:3001/api/monetization-plan/${userId}`, {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });
    
    if (!getResponse.ok) {
      console.log(`❌ GET request failed: ${getResponse.status} - ${await getResponse.text()}`);
      return;
    }
    
    const savedPlan = await getResponse.json();
    console.log(`✅ Saved plan retrieved successfully - ${Object.keys(savedPlan).length - 1} ideas`);
    
    console.log('\n🎉 Real user flow test completed successfully!');
    console.log('\n💡 If you\'re still seeing "failed to Monetization plan" in the UI:');
    console.log('   1. Check browser console for specific error messages');
    console.log('   2. Ensure you\'re logged in properly');
    console.log('   3. Make sure you have Brand DNA generated first');
    console.log('   4. Check that you have sufficient credits');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRealUserFlow();