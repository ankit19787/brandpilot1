import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function clearOldScheduledPosts() {
  try {
    // Mark all old scheduled posts as 'cancelled' to avoid duplicate processing
    const result = await prisma.post.updateMany({
      where: { 
        status: 'scheduled',
        scheduledFor: {
          lt: new Date() // Less than current time (overdue)
        }
      },
      data: { status: 'cancelled' }
    });
    
    console.log(`✅ Marked ${result.count} old scheduled posts as cancelled`);
    
    // Now create fresh test posts
    const user = await prisma.user.findFirst();
    if (!user) {
      console.error('❌ No user found');
      return;
    }
    
    const scheduledTime = new Date(Date.now() + 30 * 1000);
    
    const newPosts = [
      {
        platform: 'X',
        content: `🔧 Fresh test for X - ${new Date().toLocaleTimeString()}`,
        imageUrl: null
      },
      {
        platform: 'Facebook', 
        content: `🔧 Fresh test for Facebook - ${new Date().toLocaleTimeString()}`,
        imageUrl: null
      }
    ];
    
    const created = [];
    for (const post of newPosts) {
      const result = await prisma.post.create({
        data: {
          userId: user.id,
          platform: post.platform,
          content: post.content,
          imageUrl: post.imageUrl,
          status: 'scheduled',
          scheduledFor: scheduledTime
        }
      });
      created.push(result);
    }
    
    console.log('\n🆕 Created fresh test posts:');
    console.log('━'.repeat(50));
    created.forEach(post => {
      console.log(`${post.platform}: ${post.id} - Due: ${scheduledTime.toLocaleString()}`);
    });
    console.log('━'.repeat(50));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearOldScheduledPosts();