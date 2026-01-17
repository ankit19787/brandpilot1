const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCreditFixes() {
  try {
    console.log('🧪 Testing Credit Deduction Fixes\n');
    
    // Get a test user
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('❌ No users found in database');
      return;
    }
    
    console.log(`📊 Testing with user: ${user.username}`);
    console.log(`   Current credits: ${user.credits}\n`);
    
    // Test 1: Check recent publish transactions
    console.log('📝 Test 1: Checking for duplicate publish transactions...');
    const publishTransactions = await prisma.creditTransaction.findMany({
      where: {
        userId: user.id,
        action: 'content_publish'
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`   Found ${publishTransactions.length} recent publish transactions`);
    
    // Group by description to find duplicates
    const grouped = {};
    publishTransactions.forEach(tx => {
      if (!grouped[tx.description]) {
        grouped[tx.description] = [];
      }
      grouped[tx.description].push(tx);
    });
    
    let hasDuplicates = false;
    Object.keys(grouped).forEach(desc => {
      if (grouped[desc].length > 1) {
        hasDuplicates = true;
        console.log(`   ⚠️  Found ${grouped[desc].length} transactions for: ${desc}`);
        grouped[desc].forEach((tx, i) => {
          console.log(`      ${i + 1}. ${tx.createdAt.toISOString()} - ${tx.amount} credits`);
        });
      }
    });
    
    if (!hasDuplicates) {
      console.log('   ✅ No duplicate publish transactions found!');
    }
    
    // Test 2: Check image generation transactions
    console.log('\n📷 Test 2: Checking image generation transactions...');
    const imageTransactions = await prisma.creditTransaction.findMany({
      where: {
        userId: user.id,
        action: 'image_generation'
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`   Found ${imageTransactions.length} image generation transactions`);
    imageTransactions.forEach((tx, i) => {
      console.log(`   ${i + 1}. ${tx.createdAt.toISOString()}`);
      console.log(`      Amount: ${tx.amount} credits`);
      console.log(`      Description: ${tx.description}`);
    });
    
    // Test 3: Check scheduled posts status
    console.log('\n📅 Test 3: Checking scheduled posts...');
    const scheduledPosts = await prisma.post.findMany({
      where: {
        userId: user.id,
        status: { in: ['scheduled', 'publishing', 'published'] }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`   Found ${scheduledPosts.length} posts`);
    const statusCounts = {};
    scheduledPosts.forEach(post => {
      statusCounts[post.status] = (statusCounts[post.status] || 0) + 1;
    });
    
    console.log('   Status breakdown:');
    Object.keys(statusCounts).forEach(status => {
      console.log(`      ${status}: ${statusCounts[status]}`);
    });
    
    // Check for posts stuck in 'publishing' state
    const stuckPosts = scheduledPosts.filter(p => p.status === 'publishing');
    if (stuckPosts.length > 0) {
      console.log(`\n   ⚠️  Found ${stuckPosts.length} posts stuck in 'publishing' state:`);
      stuckPosts.forEach(post => {
        console.log(`      Post ${post.id}: ${post.platform}, attempts: ${post.publishAttempts || 0}`);
        console.log(`      Last attempt: ${post.lastPublishAttempt || 'never'}`);
      });
    } else {
      console.log('   ✅ No posts stuck in publishing state');
    }
    
    console.log('\n✅ Credit fix tests complete!\n');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCreditFixes();