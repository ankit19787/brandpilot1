const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugRealUser() {
  try {
    console.log('🔍 Debugging Real User Authentication and Monetization Flow...\n');
    
    // Check all users to see what we have
    const users = await prisma.user.findMany({
      include: {
        brandDNA: true,
        contentStrategies: true,
        monetizationPlans: true
      }
    });
    
    console.log('📋 Available Users:');
    users.forEach(user => {
      console.log(`  🧑 ${user.username} (ID: ${user.id})`);
      console.log(`     Role: ${user.role}, Plan: ${user.plan}, Credits: ${user.credits}`);
      console.log(`     Brand DNA: ${user.brandDNA.length}, Strategies: ${user.contentStrategies.length}, Monetization: ${user.monetizationPlans.length}`);
    });
    
    // Test with different user types
    const testUsers = ['testuser', 'admin', 'demo1'];
    
    for (const username of testUsers) {
      const user = users.find(u => u.username === username);
      if (!user) continue;
      
      console.log(`\n🧪 Testing with ${username} (${user.id})...`);
      
      // Test if this user can generate monetization plan
      try {
        const fetch = require('node-fetch');
        const sampleDNA = {
          voice: "Professional and friendly",
          personality: "Expert, approachable, and helpful", 
          contentPillars: ["Technology", "Innovation", "Growth"],
          audienceType: "Tech professionals and entrepreneurs",
          writingStyle: "Clear, engaging, and informative"
        };
        
        const response = await fetch('http://localhost:3001/api/monetization-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dna: sampleDNA,
            metrics: { currentFollowers: 25000, engagement: 4.8 },
            userId: user.id
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`  ✅ Monetization API works - generated ${result.length} ideas`);
          
          // Check if saved to database
          const saved = await prisma.monetizationPlan.findFirst({
            where: { userId: user.id, isActive: true },
            orderBy: { createdAt: 'desc' }
          });
          
          if (saved) {
            console.log(`  ✅ Saved to database at ${saved.createdAt}`);
          } else {
            console.log(`  ❌ NOT saved to database`);
          }
          
        } else {
          const errorText = await response.text();
          console.log(`  ❌ API failed: ${response.status} - ${errorText}`);
        }
        
      } catch (error) {
        console.log(`  ❌ Error testing ${username}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugRealUser();