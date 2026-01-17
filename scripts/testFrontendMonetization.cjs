// Test the frontend monetization flow 
console.log('Testing frontend monetization component...');

async function testFrontendMonetization() {
  try {
    // Test the GET endpoint that was failing
    console.log('Testing GET /api/monetization-plan/userId endpoint...');
    
    const response = await fetch('http://localhost:5174/api/monetization-plan/3a4b6e64-f294-422b-92cc-2944e876c32c');
    console.log('GET response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ GET request successful:', data);
    } else {
      const errorText = await response.text();
      console.log('❌ GET request failed:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFrontendMonetization();