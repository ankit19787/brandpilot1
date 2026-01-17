const fetch = require('node-fetch');

async function testMonetizationPlan() {
  try {
    console.log('Testing Monetization Plan API endpoint...\n');
    
    const testDNA = {
      voice: "Professional and friendly",
      personality: "Expert, approachable, and helpful",
      contentPillars: ["Technology", "Innovation", "Growth"],
      audienceType: "Tech professionals and entrepreneurs",
      writingStyle: "Clear, engaging, and informative"
    };
    
    const testMetrics = {
      currentFollowers: 25000,
      engagement: 4.8
    };
    
    console.log('Sending request to /api/monetization-plan...');
    
    const response = await fetch('http://localhost:3001/api/monetization-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dna: testDNA,
        metrics: testMetrics,
        userId: '3a4b6e64-f294-422b-92cc-2944e876c32c' // testuser
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Success! Result:', result);
    
    // Test the GET endpoint
    console.log('\nTesting GET /api/monetization-plan/:userId...');
    const getResponse = await fetch('http://localhost:3001/api/monetization-plan/3a4b6e64-f294-422b-92cc-2944e876c32c');
    
    if (getResponse.ok) {
      const savedPlan = await getResponse.json();
      console.log('✅ Saved plan retrieved:', savedPlan);
    } else {
      console.log('ℹ️  No saved plan found (this is normal for first test)');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testMonetizationPlan();