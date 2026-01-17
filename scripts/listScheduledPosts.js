import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function listScheduledPosts() {
  try {
    const posts = await prisma.post.findMany({
      where: { status: 'scheduled' },
      orderBy: { scheduledFor: 'asc' }
    });
    
    console.log('\n📋 Scheduled Posts in Database:');
    console.log('━'.repeat(70));
    
    if (posts.length === 0) {
      console.log('\n   No scheduled posts found.\n');
      console.log('   Create one with: node scripts/testScheduledPost.js\n');
    } else {
      const now = new Date();
      
      posts.forEach((post, i) => {
        const scheduledTime = new Date(post.scheduledFor);
        const isPast = scheduledTime <= now;
        const timeUntil = Math.round((scheduledTime - now) / 1000);
        
        console.log(`\n${i + 1}. ${post.platform} Post`);
        console.log(`   ID: ${post.id}`);
        console.log(`   Content: ${post.content.substring(0, 60)}${post.content.length > 60 ? '...' : ''}`);
        console.log(`   Scheduled: ${scheduledTime.toLocaleString()}`);
        console.log(`   Status: ${post.status}`);
        
        if (isPast) {
          console.log(`   ⚠️  OVERDUE by ${Math.abs(timeUntil)} seconds`);
        } else {
          console.log(`   ⏳ Due in ${timeUntil} seconds`);
        }
      });
      
      console.log('\n' + '━'.repeat(70));
      console.log(`Total: ${posts.length} scheduled post(s)\n`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listScheduledPosts();
