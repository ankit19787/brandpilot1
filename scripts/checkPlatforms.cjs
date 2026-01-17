const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPlatforms() {
  try {
    const posts = await prisma.post.findMany({
      select: { platform: true }
    });
    
    const platforms = posts.map(p => p.platform);
    const uniquePlatforms = [...new Set(platforms)];
    
    console.log('🔍 Platform variations found in database:');
    uniquePlatforms.forEach(platform => {
      const count = platforms.filter(p => p === platform).length;
      console.log(`  - "${platform}": ${count} posts`);
    });
    
    console.log('\n📊 Total unique platform names:', uniquePlatforms.length);
    console.log('📝 These will be normalized to: Twitter/X, Facebook, Instagram');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPlatforms();