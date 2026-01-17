const fetch = require('node-fetch');

async function testWithRealUser() {
    try {
        const baseUrl = 'http://localhost:3001';
        
        // First, create a test user with credits
        console.log('🔧 Setting up test user...');
        const setupResponse = await fetch(`${baseUrl}/api/test-connection`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: 'monetization-test-user',
                email: 'test@monetization.com',
                credits: 100
            })
        });
        
        const setupResult = await setupResponse.json();
        console.log('Setup result:', setupResult.message || setupResult.error);
        
        if (setupResult.userId) {
            // Now test monetization with the real user
            console.log('🧪 Testing monetization with real user...');
            const testData = {
                dna: {
                    mission: "Help businesses grow through authentic brand storytelling",
                    values: ["authenticity", "growth", "transparency"],
                    personality: "Innovative and results-driven"
                },
                metrics: {
                    currentFollowers: 25000,
                    engagement: 4.8
                },
                userId: setupResult.userId
            };
            
            const response = await fetch(`${baseUrl}/api/monetization-plan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testData)
            });
            
            const result = await response.json();
            console.log('\n📊 Monetization API Response:');
            console.log('Status:', response.status);
            console.log('Has plans array:', Array.isArray(result.plans));
            console.log('Plans count:', result.plans ? result.plans.length : 0);
            console.log('Credits remaining:', result.credits);
            console.log('Credit cost:', result.creditCost);
            
            if (response.status === 200 && Array.isArray(result.plans)) {
                console.log('✅ Monetization API working correctly!');
                console.log('First plan title:', result.plans[0]?.title);
            } else {
                console.log('❌ API issue:', result);
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testWithRealUser();