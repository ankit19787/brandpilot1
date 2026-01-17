const fetch = require('node-fetch');

async function testMonetizationAPI() {
    try {
        const baseUrl = 'http://localhost:3001';
        
        // Test monetization plan endpoint without user context  
        const testData = {
            dna: {
                mission: "Help businesses grow through authentic brand storytelling",
                values: ["authenticity", "growth", "transparency"],
                personality: "Innovative and results-driven"
            },
            metrics: {
                currentFollowers: 25000,
                engagement: 4.8
            }
            // No userId - should return plain array
        };
        
        console.log('🧪 Testing monetization plan API without user context...');
        const response = await fetch(`${baseUrl}/api/monetization-plan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });
        
        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Response structure:');
        console.log('- Has plans array:', Array.isArray(result.plans));
        console.log('- Plans count:', result.plans ? result.plans.length : 0);
        console.log('- Has credits:', typeof result.credits);
        console.log('- First plan structure:', result.plans?.[0] ? Object.keys(result.plans[0]) : 'N/A');
        
        if (response.status === 200 && result.plans && Array.isArray(result.plans)) {
            console.log('✅ Monetization API response format is correct!');
        } else {
            console.log('❌ Response format issue:', result);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testMonetizationAPI();