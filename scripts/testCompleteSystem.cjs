const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCompleteSystem() {
  try {
    console.log('🚀 Testing complete auto-post system with response tracking...\n');
    
    // Find admin user
    const user = await prisma.user.findFirst({
      where: { role: 'admin' }
    });
    
    if (!user) {
      console.log('❌ No admin user found');
      return;
    }
    
    console.log(`✅ Using user: ${user.username} (${user.id})\n`);

    // Create test posts for different platforms scheduled 30 seconds from now
    const scheduledTime = new Date(Date.now() + 30 * 1000);
    
    const testPosts = [
      {
        platform: 'X (Twitter)',
        content: `✨ Testing Twitter with response tracking - ${new Date().toLocaleTimeString()} #BrandPilot`,
        imageUrl: null
      },
      {
        platform: 'Facebook', 
        content: `🔥 Testing Facebook with response tracking - ${new Date().toLocaleTimeString()}`,
        imageUrl: null
      }
    ];
    
    console.log(`📅 Creating test posts scheduled for: ${scheduledTime.toISOString()}\n`);
    
    const createdPosts = [];
    
    for (const testPost of testPosts) {
      const post = await prisma.post.create({
        data: {
          userId: user.id,
          platform: testPost.platform,
          content: testPost.content,
          imageUrl: testPost.imageUrl,
          status: 'scheduled',
          scheduledFor: scheduledTime,
          publishAttempts: 0
        }
      });
      
      createdPosts.push(post);
      console.log(`✅ Created ${testPost.platform} test post: ${post.id}`);
    }
    
    console.log('\n🎯 Test posts created successfully!');
    console.log('📋 Summary:');
    createdPosts.forEach(post => {
      console.log(`  - ${post.platform}: ${post.id}`);
      console.log(`    Content: ${post.content}`);
      console.log(`    Scheduled: ${post.scheduledFor.toISOString()}`);
      console.log(`    Status: ${post.status}`);
      console.log('');
    });
    
    console.log('⏰ Posts are scheduled to auto-publish in ~30 seconds');
    console.log('📊 To monitor progress:');
    console.log('  1. Open the app in browser (http://localhost:3000)');
    console.log('  2. Check browser console for [Agent] logs');
    console.log('  3. Verify posts appear on actual social media platforms');
    console.log('  4. Run: node scripts/checkPostDetails.cjs');
    
    console.log('\n🔍 Platform response tracking will record:');
    console.log('  ✅ Success: platformPostId, platformResponse JSON');
    console.log('  ❌ Failure: platformError, publishAttempts, lastPublishAttempt');
    console.log('  📈 All attempts: publishAttempts counter');
    
  } catch (error) {
    console.error('❌ Error testing complete system:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCompleteSystem();