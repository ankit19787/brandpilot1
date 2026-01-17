const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function normalizePlatformNames() {
  console.log('\n🔧 Normalizing platform names in database...\n');

  try {
    // Normalize X/Twitter variants
    const twitterUpdates = await prisma.post.updateMany({
      where: {
        OR: [
          { platform: { contains: 'twitter', mode: 'insensitive' } },
          { platform: 'X' },
          { platform: 'x' },
        ]
      },
      data: {
        platform: 'X (Twitter)'
      }
    });
    console.log(`✅ Updated ${twitterUpdates.count} Twitter/X posts`);

    // Normalize Facebook
    const facebookUpdates = await prisma.post.updateMany({
      where: {
        platform: { equals: 'facebook', mode: 'insensitive' }
      },
      data: {
        platform: 'Facebook'
      }
    });
    console.log(`✅ Updated ${facebookUpdates.count} Facebook posts`);

    // Normalize Instagram
    const instagramUpdates = await prisma.post.updateMany({
      where: {
        platform: { equals: 'instagram', mode: 'insensitive' }
      },
      data: {
        platform: 'Instagram'
      }
    });
    console.log(`✅ Updated ${instagramUpdates.count} Instagram posts`);

    // Normalize LinkedIn
    const linkedinUpdates = await prisma.post.updateMany({
      where: {
        platform: { equals: 'linkedin', mode: 'insensitive' }
      },
      data: {
        platform: 'LinkedIn'
      }
    });
    console.log(`✅ Updated ${linkedinUpdates.count} LinkedIn posts`);

    // Show final platform distribution
    console.log('\n📊 Platform distribution after normalization:\n');
    const platforms = await prisma.post.groupBy({
      by: ['platform'],
      _count: true
    });
    
    platforms.forEach(p => {
      console.log(`  ${p.platform}: ${p._count} posts`);
    });

    console.log('\n✅ Platform normalization complete!\n');
  } catch (error) {
    console.error('❌ Error normalizing platforms:', error);
  } finally {
    await prisma.$disconnect();
  }
}

normalizePlatformNames();
