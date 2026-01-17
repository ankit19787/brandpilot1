// Test script to verify the complete monetization flow
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testMonetizationFlow() {
  try {
    console.log('🔍 Testing Complete Monetization Flow...\n');
    
    // 1. Check if user exists and has Brand DNA
    const userId = '3a4b6e64-f294-422b-92cc-2944e876c32c';
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        brandDNA: { where: { isActive: true } },
        monetizationPlans: { where: { isActive: true } }
      }
    });
    
    if (!user) {
      console.log('❌ Test user not found');
      return;
    }
    
    console.log('✅ User found:', user.username);
    console.log('   Credits:', user.credits);
    console.log('   Active Brand DNA entries:', user.brandDNA.length);
    console.log('   Active Monetization Plans:', user.monetizationPlans.length);
    
    // 2. Create a sample Brand DNA if none exists
    let brandDNA = user.brandDNA[0];
    if (!brandDNA) {
      console.log('\n📝 Creating sample Brand DNA...');
      brandDNA = await prisma.brandDNA.create({
        data: {
          userId,
          voice: "Professional and engaging",
          personality: "Expert, approachable, and helpful",
          contentPillars: "Technology,Innovation,Growth", 
          audienceType: "Tech professionals and entrepreneurs",
          writingStyle: "Clear, engaging, and informative",
          inputData: "Sample posts for testing",
          isActive: true
        }
      });
      console.log('✅ Brand DNA created');
    }
    
    // 3. Test monetization plan generation via API
    console.log('\n🚀 Testing API monetization plan generation...');
    const fetch = require('node-fetch');
    
    const testDNA = {
      voice: brandDNA.voice,
      personality: brandDNA.personality,
      contentPillars: brandDNA.contentPillars.split(','),
      audienceType: brandDNA.audienceType,
      writingStyle: brandDNA.writingStyle
    };
    
    const testMetrics = {
      currentFollowers: 25000,
      engagement: 4.8
    };
    
    const response = await fetch('http://localhost:3001/api/monetization-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dna: testDNA, metrics: testMetrics, userId })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ API request failed:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Monetization plan generated successfully');
    console.log('   Number of ideas:', result.length);
    
    // 4. Check if plan was saved to database
    const savedPlan = await prisma.monetizationPlan.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    
    if (savedPlan) {
      console.log('✅ Plan saved to database at:', savedPlan.createdAt);
    } else {
      console.log('❌ Plan not found in database');
    }
    
    // 5. Test GET endpoint 
    const getResponse = await fetch(`http://localhost:3001/api/monetization-plan/${userId}`);
    if (getResponse.ok) {
      const savedData = await getResponse.json();
      console.log('✅ GET endpoint working, retrieved plan with', Object.keys(savedData).length - 1, 'ideas'); // -1 for createdAt
    } else {
      console.log('❌ GET endpoint failed');
    }
    
    console.log('\n🎉 Monetization flow test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMonetizationFlow();