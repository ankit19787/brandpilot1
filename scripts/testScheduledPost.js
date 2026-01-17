import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function createTestScheduledPost() {
  try {
    // Find the first user
    const user = await prisma.user.findFirst();
    
    if (!user) {
      console.error('❌ No user found. Please create a user first.');
      return;
    }
    
    console.log('✅ Found user:', user.username, `(${user.id})`);
    
    // Create a post scheduled for 30 seconds from now
    const scheduledTime = new Date(Date.now() + 30 * 1000);
    
    const post = await prisma.post.create({
      data: {
        userId: user.id,
        platform: 'X',
        content: `🤖 Auto-post test - scheduled at ${new Date().toLocaleTimeString()}`,
        imageUrl: null,
        status: 'scheduled',
        scheduledFor: scheduledTime,
        createdAt: new Date()
      }
    });
    
    console.log('\n✅ Test post created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📝 Post ID: ${post.id}`);
    console.log(`📱 Platform: ${post.platform}`);
    console.log(`📄 Content: ${post.content}`);
    console.log(`⏰ Scheduled for: ${scheduledTime.toLocaleString()}`);
    console.log(`⏱️  Time until due: 30 seconds`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔔 IMPORTANT:');
    console.log('   1. Make sure Auto-Post is ENABLED in the app');
    console.log('   2. Refresh the Calendar page to see the post');
    console.log('   3. Watch the console - it should publish in ~30 seconds');
    console.log('   4. Current time:', new Date().toLocaleString());
    console.log('   5. Due time:', scheduledTime.toLocaleString());
    
  } catch (error) {
    console.error('❌ Error creating test post:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestScheduledPost();
