const fetch = require('node-fetch');

async function createAndTestDatabasePriority() {
    try {
        const baseUrl = 'http://localhost:3001/api';
        const userId = 'database-priority-test';
        
        console.log('🔧 Step 1: Creating test data for all three components...\n');
        
        // Create Brand DNA first
        console.log('Creating Brand DNA...');
        const brandDnaData = {
            input: "We are a tech startup focused on AI-powered productivity tools for small businesses. Our mission is to democratize AI and make it accessible to everyone.",
            userId: userId
        };
        
        const brandResponse = await fetch(`${baseUrl}/brand-dna`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(brandDnaData)
        });
        
        if (!brandResponse.ok) {
            console.log('❌ Failed to create Brand DNA:', brandResponse.status);
            return;
        }
        
        const brandResult = await brandResponse.json();
        console.log('✅ Brand DNA created');
        
        // Wait a moment for any async operations
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Create Content Strategy
        console.log('Creating Content Strategy...');
        const strategyData = {
            dna: brandResult.dna || {
                voice: "Professional yet approachable",
                personality: ["innovative", "helpful", "trustworthy"]
            },
            metrics: { followers: 5000, engagement: 4.2 },
            userId: userId
        };
        
        const strategyResponse = await fetch(`${baseUrl}/content-strategy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(strategyData)
        });
        
        if (!strategyResponse.ok) {
            console.log('❌ Failed to create Content Strategy:', strategyResponse.status);
        } else {
            console.log('✅ Content Strategy created');
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Create Monetization Plan
        console.log('Creating Monetization Plan...');
        const monetizationData = {
            dna: strategyData.dna,
            metrics: strategyData.metrics,
            userId: userId
        };
        
        const monetizationResponse = await fetch(`${baseUrl}/monetization-plan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(monetizationData)
        });
        
        if (!monetizationResponse.ok) {
            console.log('❌ Failed to create Monetization Plan:', monetizationResponse.status);
        } else {
            console.log('✅ Monetization Plan created');
        }
        
        console.log('\\n🧪 Step 2: Now testing GET endpoints to verify data exists...\\n');
        
        // Test all GET endpoints
        const endpoints = [
            { name: 'Brand DNA', path: 'brand-dna', key: 'dna' },
            { name: 'Content Strategy', path: 'content-strategy', key: 'strategy' },
            { name: 'Monetization Plan', path: 'monetization-plan', key: 'plans' }
        ];
        
        for (const endpoint of endpoints) {
            const response = await fetch(`${baseUrl}/${endpoint.path}/${userId}`);
            console.log(`📦 ${endpoint.name} GET:`, response.status);
            
            if (response.ok) {
                const data = await response.json();
                const hasData = !!data[endpoint.key];
                console.log(`   Data exists: ${hasData ? '✅ YES' : '❌ NO'}`);
                if (hasData && endpoint.key === 'plans' && Array.isArray(data[endpoint.key])) {
                    console.log(`   Plans count: ${data[endpoint.key].length}`);
                }
            } else {
                console.log(`   Error: ${await response.text()}`);
            }
        }
        
        console.log('\\n🎯 Database priority test complete! Components should now use existing data.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

createAndTestDatabasePriority();