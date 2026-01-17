const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPlatforms() {
  try {
    const platforms = await prisma.post.groupBy({
      by: ['platform'],
      _count: true
    });
    
    console.log('\n📊 Platform values in database:\n');
    platforms.forEach(p => {
      console.log(`  ${p.platform}: ${p._count} posts`);
    });
    
    console.log('\n');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPlatforms();
