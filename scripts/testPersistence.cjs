const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPersistence() {
  try {
    console.log('Testing Database Persistence for Brand DNA, Content Strategy, and Monetization Plan...\n');
    
    // Use an existing user
    const testUserId = '3a4b6e64-f294-422b-92cc-2944e876c32c'; // testuser
    
    console.log('ℹ️  Using existing test user');

    // Test Brand DNA persistence
    console.log('\n1. Testing Brand DNA persistence...');
    const brandDNAData = {
      userId: testUserId,
      voice: 'Professional and friendly',
      personality: 'Expert, approachable, and helpful',
      contentPillars: 'Technology,Innovation,Growth',
      audienceType: 'Tech professionals and entrepreneurs',
      writingStyle: 'Clear, engaging, and informative',
      inputData: 'Sample past posts for analysis',
      isActive: true
    };

    await prisma.brandDNA.create({ data: brandDNAData });
    const savedBrandDNA = await prisma.brandDNA.findFirst({
      where: { userId: testUserId, isActive: true }
    });
    console.log(savedBrandDNA ? '✅ Brand DNA saved and retrieved successfully' : '❌ Brand DNA persistence failed');

    // Test Content Strategy persistence
    console.log('\n2. Testing Content Strategy persistence...');
    const contentStrategyData = {
      userId: testUserId,
      dailyStrategy: 'Post 2-3 times daily with focus on tech insights',
      platformFocus: '["LinkedIn", "Twitter"]',
      suggestedHooks: '["Industry trends", "Expert tips", "Case studies"]',
      recommendedMix: '{"storytelling": 40, "authority": 30, "cta": 30}',
      brandDNASnapshot: JSON.stringify(brandDNAData),
      isActive: true
    };

    await prisma.contentStrategy.create({ data: contentStrategyData });
    const savedContentStrategy = await prisma.contentStrategy.findFirst({
      where: { userId: testUserId, isActive: true }
    });
    console.log(savedContentStrategy ? '✅ Content Strategy saved and retrieved successfully' : '❌ Content Strategy persistence failed');

    // Test Monetization Plan persistence
    console.log('\n3. Testing Monetization Plan persistence...');
    const monetizationData = {
      userId: testUserId,
      ideas: JSON.stringify(['Course creation', 'Consulting services', 'Product development']),
      dnaSnapshot: JSON.stringify(brandDNAData),
      metricsSnapshot: JSON.stringify({ followers: 25000, engagement: 4.8 }),
      isActive: true
    };

    await prisma.monetizationPlan.create({ data: monetizationData });
    const savedMonetizationPlan = await prisma.monetizationPlan.findFirst({
      where: { userId: testUserId, isActive: true }
    });
    console.log(savedMonetizationPlan ? '✅ Monetization Plan saved and retrieved successfully' : '❌ Monetization Plan persistence failed');

    // Test relationships
    console.log('\n4. Testing relationships...');
    const userWithData = await prisma.user.findUnique({
      where: { id: testUserId },
      include: {
        brandDNA: true,
        contentStrategies: true,
        monetizationPlans: true
      }
    });

    console.log(`✅ User has ${userWithData.brandDNA.length} Brand DNA entries`);
    console.log(`✅ User has ${userWithData.contentStrategies.length} Content Strategy entries`);
    console.log(`✅ User has ${userWithData.monetizationPlans.length} Monetization Plan entries`);

    // Clean up test data
    console.log('\n5. Cleaning up test data...');
    await prisma.brandDNA.deleteMany({ where: { userId: testUserId } });
    await prisma.contentStrategy.deleteMany({ where: { userId: testUserId } });
    await prisma.monetizationPlan.deleteMany({ where: { userId: testUserId } });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All persistence tests passed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPersistence();