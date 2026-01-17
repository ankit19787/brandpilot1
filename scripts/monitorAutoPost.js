import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function monitorAutoPost() {
  console.log('\n🔍 Auto-Post Monitor - Watching for changes...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const postId = '3962f5df-e881-4f16-a792-9f529e68fe96';
  let lastStatus = null;
  let checkCount = 0;
  
  const interval = setInterval(async () => {
    try {
      checkCount++;
      const post = await prisma.post.findUnique({
        where: { id: postId }
      });
      
      if (!post) {
        console.log('❌ Post not found');
        clearInterval(interval);
        await prisma.$disconnect();
        return;
      }
      
      const now = new Date();
      const scheduledTime = new Date(post.scheduledFor);
      const secondsUntil = Math.round((scheduledTime - now) / 1000);
      
      if (post.status !== lastStatus) {
        console.log(`\n[${new Date().toLocaleTimeString()}] Status changed: ${lastStatus || 'initial'} → ${post.status}`);
        lastStatus = post.status;
      }
      
      console.log(`Check #${checkCount}: ${post.status} | Due in: ${secondsUntil}s | Published: ${post.publishedAt ? '✅' : '❌'}`);
      
      if (post.status === 'published') {
        console.log('\n✅ SUCCESS! Post was auto-published!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Status:', post.status);
        console.log('Published At:', post.publishedAt?.toLocaleString());
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        clearInterval(interval);
        await prisma.$disconnect();
        return;
      }
      
      if (post.status === 'failed') {
        console.log('\n❌ Post publishing FAILED');
        clearInterval(interval);
        await prisma.$disconnect();
        return;
      }
      
      // Stop after 45 seconds
      if (checkCount > 45) {
        console.log('\n⏱️  Timeout - stopping monitor');
        console.log('💡 Check server logs for errors\n');
        clearInterval(interval);
        await prisma.$disconnect();
      }
      
    } catch (error) {
      console.error('❌ Monitor error:', error);
      clearInterval(interval);
      await prisma.$disconnect();
    }
  }, 1000); // Check every second
}

monitorAutoPost();
