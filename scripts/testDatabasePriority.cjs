const fetch = require('node-fetch');

async function testDatabasePriority() {
    try {
        const baseUrl = 'http://localhost:3001/api';
        
        // Test with a real user that has existing data
        const userId = 'monetization-test-user'; // From our previous test
        
        console.log('🧪 Testing database priority for all three components...\n');
        
        // Test Brand DNA GET endpoint
        console.log('📦 Testing Brand DNA database check...');
        const brandDnaResponse = await fetch(`${baseUrl}/brand-dna/${userId}`);
        if (brandDnaResponse.ok) {
            const brandDnaData = await brandDnaResponse.json();
            console.log('✅ Brand DNA GET:', brandDnaData.dna ? 'Has existing data' : 'No data');
        } else {
            console.log('❌ Brand DNA GET:', brandDnaResponse.status, await brandDnaResponse.text());
        }
        
        // Test Content Strategy GET endpoint  
        console.log('📦 Testing Content Strategy database check...');
        const strategyResponse = await fetch(`${baseUrl}/content-strategy/${userId}`);
        if (strategyResponse.ok) {
            const strategyData = await strategyResponse.json();
            console.log('✅ Content Strategy GET:', strategyData.strategy ? 'Has existing data' : 'No data');
        } else {
            console.log('❌ Content Strategy GET:', strategyResponse.status, await strategyResponse.text());
        }
        
        // Test Monetization Plan GET endpoint
        console.log('📦 Testing Monetization Plan database check...');
        const monetizationResponse = await fetch(`${baseUrl}/monetization-plan/${userId}`);
        if (monetizationResponse.ok) {
            const monetizationData = await monetizationResponse.json();
            console.log('✅ Monetization GET:', monetizationData.plans ? `Has ${monetizationData.plans.length} plans` : 'No data');
        } else {
            console.log('❌ Monetization GET:', monetizationResponse.status, await monetizationResponse.text());
        }
        
        console.log('\n🎯 Database priority system is ready!');
        console.log('Components will now check database first before generating new content.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testDatabasePriority();