const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugAutoLoading() {
  try {
    console.log('🔍 Debug Auto-Loading Issues\n');
    
    // Check if we have any users
    const users = await prisma.user.findMany({
      include: {
        brandDna: true,
        contentStrategy: true,
        monetizationPlans: true
      }
    });
    
    console.log('👥 Found users:', users.length);
    
    users.forEach(user => {
      console.log(`\n👤 User ${user.id} (${user.username}):`);
      console.log(`   - Brand DNA: ${user.brandDna ? 'EXISTS' : 'MISSING'}`);
      console.log(`   - Content Strategy: ${user.contentStrategy ? 'EXISTS' : 'MISSING'}`);
      console.log(`   - Monetization Plans: ${user.monetizationPlans.length} plans`);
      
      if (user.brandDna) {
        console.log(`     🧬 DNA created: ${user.brandDna.createdAt}`);
        console.log(`     🧬 DNA active: ${user.brandDna.isActive}`);
      }
      
      if (user.contentStrategy) {
        console.log(`     📝 Strategy created: ${user.contentStrategy.createdAt}`);
        console.log(`     📝 Strategy active: ${user.contentStrategy.isActive}`);
      }
      
      user.monetizationPlans.forEach((plan, index) => {
        console.log(`     💰 Plan ${index + 1}: ${plan.title} (active: ${plan.isActive})`);
      });
    });
    
    // Test GET endpoints simulation
    console.log('\n🌐 Testing GET endpoints simulation...');
    
    for (const user of users) {
      console.log(`\n📡 Testing endpoints for user ${user.id}:`);
      
      // Test Brand DNA endpoint
      const dna = await prisma.brandDna.findFirst({
        where: { userId: user.id, isActive: true }
      });
      console.log(`   GET /brand-dna/${user.id}: ${dna ? 'SUCCESS' : 'NOT_FOUND'}`);
      
      // Test Content Strategy endpoint
      const strategy = await prisma.contentStrategy.findFirst({
        where: { userId: user.id, isActive: true }
      });
      console.log(`   GET /content-strategy/${user.id}: ${strategy ? 'SUCCESS' : 'NOT_FOUND'}`);
      
      // Test Monetization Plans endpoint
      const plans = await prisma.monetizationPlan.findMany({
        where: { userId: user.id, isActive: true },
        orderBy: { createdAt: 'desc' }
      });
      console.log(`   GET /monetization-plan/${user.id}: ${plans.length} plans found`);
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAutoLoading();