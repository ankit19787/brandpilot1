const fetch = require('node-fetch');

async function testDatabasePriorityFlow() {
    try {
        const baseUrl = 'http://localhost:3001/api';
        
        // First, create a user with data in all three tables
        console.log('🔧 Creating test user with existing data...\n');
        
        // Create Brand DNA
        const brandDnaData = {
            input: "We help small businesses grow through authentic storytelling and proven marketing strategies.",
            userId: "database-test-user"
        };
        
        const brandResponse = await fetch(`${baseUrl}/brand-dna`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(brandDnaData)
        });
        
        if (brandResponse.ok) {
            console.log('✅ Created Brand DNA data');
        } else {
            console.log('❌ Failed to create Brand DNA:', await brandResponse.text());
        }
        
        // Wait a moment then create Content Strategy
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const strategyData = {
            dna: {
                voice: "Authentic and helpful",
                personality: ["friendly", "expert", "trustworthy"]
            },
            metrics: { followers: 10000, engagement: 3.5 },
            userId: "database-test-user"
        };
        
        const strategyResponse = await fetch(`${baseUrl}/content-strategy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(strategyData)
        });
        
        if (strategyResponse.ok) {
            console.log('✅ Created Content Strategy data');
        } else {
            console.log('❌ Failed to create Content Strategy:', await strategyResponse.text());
        }
        
        // Wait a moment then create Monetization Plan
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const monetizationData = {
            dna: strategyData.dna,
            metrics: strategyData.metrics,
            userId: "database-test-user"
        };
        
        const monetizationResponse = await fetch(`${baseUrl}/monetization-plan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(monetizationData)
        });
        
        if (monetizationResponse.ok) {
            console.log('✅ Created Monetization Plan data');
        } else {
            console.log('❌ Failed to create Monetization Plan:', await monetizationResponse.text());
        }
        
        console.log('\n🧪 Now testing if GET endpoints return the existing data...\n');
        
        // Test Brand DNA GET
        const brandGetResponse = await fetch(`${baseUrl}/brand-dna/database-test-user`);
        if (brandGetResponse.ok) {
            const brandData = await brandGetResponse.json();
            console.log('📦 Brand DNA GET:', brandData.dna ? '✅ Returns existing data' : '❌ No data found');
        } else {
            console.log('📦 Brand DNA GET: ❌ Failed -', brandGetResponse.status);
        }
        
        // Test Content Strategy GET
        const strategyGetResponse = await fetch(`${baseUrl}/content-strategy/database-test-user`);
        if (strategyGetResponse.ok) {
            const strategyData = await strategyGetResponse.json();
            console.log('📦 Content Strategy GET:', strategyData.strategy ? '✅ Returns existing data' : '❌ No data found');
        } else {
            console.log('📦 Content Strategy GET: ❌ Failed -', strategyGetResponse.status);
        }
        
        // Test Monetization Plan GET
        const monetizationGetResponse = await fetch(`${baseUrl}/monetization-plan/database-test-user`);
        if (monetizationGetResponse.ok) {
            const monetizationData = await monetizationGetResponse.json();
            console.log('📦 Monetization Plan GET:', monetizationData.plans ? `✅ Returns ${monetizationData.plans.length} plans` : '❌ No data found');
        } else {
            console.log('📦 Monetization Plan GET: ❌ Failed -', monetizationGetResponse.status);
        }
        
        console.log('\n🎯 Database priority test complete!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testDatabasePriorityFlow();