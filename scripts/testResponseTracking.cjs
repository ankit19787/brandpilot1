const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testResponseTracking() {
  try {
    console.log('🧪 Testing platform response tracking...\n');
    
    // Find or create a test user
    let user = await prisma.user.findFirst({
      orderBy: { createdAt: 'asc' }
    });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          username: 'test_user',
          passwordHash: 'test',
          role: 'user',
          plan: 'pro'
        }
      });
      console.log('✅ Created test user:', user.id);
    }

    // Create a test post with response tracking data
    const testPost = await prisma.post.create({
      data: {
        userId: user.id,
        platform: 'X (Twitter)',
        content: 'Testing platform response tracking system! 🚀 #BrandPilot',
        status: 'published',
        publishedAt: new Date(),
        platformPostId: '1234567890123456789',
        platformResponse: JSON.stringify({
          success: true,
          platformPostId: '1234567890123456789',
          platformResponse: JSON.stringify({
            data: { id: '1234567890123456789', text: 'Testing platform response tracking system! 🚀 #BrandPilot' },
            includes: {}, 
            errors: [],
            meta: {}
          }),
          platformError: null,
          status: 201
        }),
        publishAttempts: 1,
        lastPublishAttempt: new Date(),
        metadata: JSON.stringify({ imageUrl: null, userId: user.id })
      }
    });

    console.log('✅ Created test post with response tracking:', {
      id: testPost.id,
      platform: testPost.platform,
      status: testPost.status,
      platformPostId: testPost.platformPostId,
      publishAttempts: testPost.publishAttempts,
      lastPublishAttempt: testPost.lastPublishAttempt,
      hasResponse: !!testPost.platformResponse,
      hasError: !!testPost.platformError
    });

    // Test failed post tracking
    const failedPost = await prisma.post.create({
      data: {
        userId: user.id,
        platform: 'Instagram',
        content: 'This should fail because no image URL provided for Instagram',
        status: 'failed',
        platformError: 'Instagram posts require an image URL',
        publishAttempts: 1,
        lastPublishAttempt: new Date(),
        metadata: JSON.stringify({ imageUrl: null, userId: user.id })
      }
    });

    console.log('\n✅ Created failed post with error tracking:', {
      id: failedPost.id,
      platform: failedPost.platform,
      status: failedPost.status,
      platformError: failedPost.platformError,
      publishAttempts: failedPost.publishAttempts,
      lastPublishAttempt: failedPost.lastPublishAttempt
    });

    // Query posts with response tracking
    const postsWithTracking = await prisma.post.findMany({
      where: {
        OR: [
          { platformResponse: { not: null } },
          { platformError: { not: null } }
        ]
      },
      select: {
        id: true,
        platform: true,
        status: true,
        platformPostId: true,
        platformError: true,
        publishAttempts: true,
        lastPublishAttempt: true,
        platformResponse: true
      }
    });

    console.log('\n📊 Posts with response tracking data:', postsWithTracking.length);
    postsWithTracking.forEach(post => {
      console.log(`  - ${post.platform} [${post.status}]: ${post.platformPostId || 'No ID'}`);
      if (post.platformError) {
        console.log(`    Error: ${post.platformError}`);
      }
      console.log(`    Attempts: ${post.publishAttempts}, Last: ${post.lastPublishAttempt}`);
    });

    console.log('\n🎉 Platform response tracking test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing response tracking:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testResponseTracking();