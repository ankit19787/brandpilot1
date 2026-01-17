import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkPostStatus() {
  try {
    const postId = 'c52069be-7a4a-40ad-8101-474c8cd39088';
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });
    
    if (!post) {
      console.log('❌ Post not found');
      return;
    }
    
    console.log('\n📊 Post Status Check:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ID:', post.id);
    console.log('Platform:', post.platform);
    console.log('Status:', post.status);
    console.log('Scheduled For:', post.scheduledFor?.toLocaleString());
    console.log('Published At:', post.publishedAt?.toLocaleString() || 'Not published');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const now = new Date();
    const scheduledTime = new Date(post.scheduledFor);
    
    if (post.status === 'scheduled') {
      if (scheduledTime <= now) {
        console.log('⚠️  Post is OVERDUE but not published yet');
        console.log('💡 Make sure Auto-Post is ENABLED in the app\n');
      } else {
        const secondsUntil = Math.round((scheduledTime - now) / 1000);
        console.log(`⏳ Post will be due in ${secondsUntil} seconds\n`);
      }
    } else if (post.status === 'published') {
      console.log('✅ Post was successfully published!\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPostStatus();
