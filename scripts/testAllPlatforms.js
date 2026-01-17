import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function createTestPostsAllPlatforms() {
  try {
    // Find the first user
    const user = await prisma.user.findFirst();
    
    if (!user) {
      console.error('❌ No user found. Please create a user first.');
      return;
    }
    
    console.log('✅ Found user:', user.username, `(${user.id})`);
    
    // Create posts scheduled for 30 seconds from now
    const scheduledTime = new Date(Date.now() + 30 * 1000);
    
    const platforms = [
      { 
        name: 'X', 
        content: '🤖 Auto-post test for X/Twitter - ' + new Date().toLocaleTimeString(),
        imageUrl: null // X allows text-only
      },
      { 
        name: 'Facebook', 
        content: '🤖 Auto-post test for Facebook - ' + new Date().toLocaleTimeString(),
        imageUrl: null // Facebook allows text-only
      },
      { 
        name: 'Instagram', 
        content: '🤖 Auto-post test for Instagram - ' + new Date().toLocaleTimeString(),
        imageUrl: 'https://images.unsplash.com/photo-1516110833967-0b5716ca1387?w=800' // Instagram requires image
      }
    ];
    
    const createdPosts = [];
    
    for (const platform of platforms) {
      const post = await prisma.post.create({
        data: {
          userId: user.id,
          platform: platform.name,
          content: platform.content,
          imageUrl: platform.imageUrl,
          status: 'scheduled',
          scheduledFor: scheduledTime,
          createdAt: new Date()
        }
      });
      createdPosts.push(post);
    }
    
    console.log('\n✅ Test posts created for ALL platforms!');
    console.log('━'.repeat(70));
    
    createdPosts.forEach(post => {
      console.log(`\n📝 ${post.platform} Post:`);
      console.log(`   ID: ${post.id}`);
      console.log(`   Content: ${post.content}`);
      console.log(`   Image: ${post.imageUrl || 'None (text-only)'}`);
      console.log(`   Scheduled for: ${scheduledTime.toLocaleString()}`);
    });
    
    console.log('\n' + '━'.repeat(70));
    console.log(`⏰ All posts scheduled for: ${scheduledTime.toLocaleString()}`);
    console.log(`⏱️  Time until due: 30 seconds`);
    console.log('\n🔔 IMPORTANT:');
    console.log('   1. Make sure Auto-Post is ENABLED in the app');
    console.log('   2. Open the app in browser: http://localhost:3000');
    console.log('   3. Open browser console to watch publishing');
    console.log('   4. All 3 posts should publish automatically in ~30 seconds');
    console.log('   5. Current time:', new Date().toLocaleString());
    console.log('   6. Due time:', scheduledTime.toLocaleString());
    console.log('\n💡 To verify status after 30 seconds:');
    console.log('   node scripts/listScheduledPosts.js\n');
    
  } catch (error) {
    console.error('❌ Error creating test posts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestPostsAllPlatforms();
