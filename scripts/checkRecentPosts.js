import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRecentPosts() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });
    
    console.log('\n=== Recent Posts ===\n');
    posts.forEach(post => {
      console.log(`Content: ${post.content.substring(0, 60)}...`);
      console.log(`Platform: ${post.platform}`);
      console.log(`Status: ${post.status}`);
      console.log(`User: ${post.user.username}`);
      console.log(`Email: ${post.user.email || '❌ NO EMAIL - notifications disabled'}`);
      console.log(`Created: ${post.createdAt}`);
      console.log('---\n');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentPosts();
