const fetch = require('node-fetch');

async function testGetEndpoints() {
    try {
        const baseUrl = 'http://localhost:3001/api';
        
        // Use a known user ID that should have data
        const userId = 'test-user'; // From previous tests
        
        console.log('🧪 Testing GET endpoints for existing data...\n');
        
        // Test Content Strategy GET endpoint
        console.log('📦 Testing Content Strategy GET...');
        const strategyResponse = await fetch(`${baseUrl}/content-strategy/${userId}`);
        console.log('Status:', strategyResponse.status);
        
        if (strategyResponse.ok) {
            const strategyData = await strategyResponse.json();
            console.log('Content Strategy Response Structure:');
            console.log('- Has strategy:', !!strategyData.strategy);
            console.log('- Keys:', Object.keys(strategyData));
            if (strategyData.strategy) {
                console.log('- Strategy keys:', Object.keys(strategyData.strategy));
            }
        } else {
            console.log('Content Strategy Error:', await strategyResponse.text());
        }
        
        console.log('\n📦 Testing Monetization Plan GET...');
        const monetizationResponse = await fetch(`${baseUrl}/monetization-plan/${userId}`);
        console.log('Status:', monetizationResponse.status);
        
        if (monetizationResponse.ok) {
            const monetizationData = await monetizationResponse.json();
            console.log('Monetization Response Structure:');
            console.log('- Has plans:', !!monetizationData.plans);
            console.log('- Keys:', Object.keys(monetizationData));
            if (monetizationData.plans) {
                console.log('- Plans count:', monetizationData.plans.length);
            }
        } else {
            console.log('Monetization Error:', await monetizationResponse.text());
        }
        
        console.log('\n📦 Testing Brand DNA GET (working one)...');
        const brandDnaResponse = await fetch(`${baseUrl}/brand-dna/${userId}`);
        console.log('Status:', brandDnaResponse.status);
        
        if (brandDnaResponse.ok) {
            const brandDnaData = await brandDnaResponse.json();
            console.log('Brand DNA Response Structure:');
            console.log('- Has dna:', !!brandDnaData.dna);
            console.log('- Keys:', Object.keys(brandDnaData));
        } else {
            console.log('Brand DNA Error:', await brandDnaResponse.text());
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testGetEndpoints();