const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPostDetails() {
  try {
    console.log('📋 Checking post details with response tracking...\n');
    
    // Get all posts with detailed information
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: { username: true }
        }
      }
    });

    if (posts.length === 0) {
      console.log('No posts found in database.');
      return;
    }

    console.log(`Found ${posts.length} recent posts:\n`);
    
    posts.forEach((post, index) => {
      console.log(`${index + 1}. ${post.platform} Post`);
      console.log(`   ID: ${post.id}`);
      console.log(`   User: ${post.user.username}`);
      console.log(`   Status: ${post.status}`);
      console.log(`   Content: ${post.content.substring(0, 80)}${post.content.length > 80 ? '...' : ''}`);
      console.log(`   Created: ${post.createdAt.toISOString()}`);
      
      if (post.scheduledFor) {
        console.log(`   Scheduled: ${post.scheduledFor.toISOString()}`);
      }
      
      if (post.publishedAt) {
        console.log(`   Published: ${post.publishedAt.toISOString()}`);
      }
      
      // Response tracking fields
      console.log(`   Platform Post ID: ${post.platformPostId || 'Not set'}`);
      console.log(`   Publish Attempts: ${post.publishAttempts || 0}`);
      
      if (post.lastPublishAttempt) {
        console.log(`   Last Attempt: ${post.lastPublishAttempt.toISOString()}`);
      }
      
      if (post.platformError) {
        console.log(`   ❌ Error: ${post.platformError}`);
      }
      
      if (post.platformResponse) {
        try {
          const response = JSON.parse(post.platformResponse);
          console.log(`   ✅ Response: Success=${response.success}, Status=${response.status}`);
        } catch (e) {
          console.log(`   📄 Response: ${post.platformResponse.substring(0, 100)}...`);
        }
      }
      
      console.log(''); // Empty line between posts
    });

    // Summary statistics
    const stats = {
      total: posts.length,
      published: posts.filter(p => p.status === 'published').length,
      failed: posts.filter(p => p.status === 'failed').length,
      scheduled: posts.filter(p => p.status === 'scheduled').length,
      withPlatformId: posts.filter(p => p.platformPostId).length,
      withErrors: posts.filter(p => p.platformError).length,
      withResponses: posts.filter(p => p.platformResponse).length
    };

    console.log('📊 Summary Statistics:');
    console.log(`   Total Posts: ${stats.total}`);
    console.log(`   Published: ${stats.published}`);
    console.log(`   Failed: ${stats.failed}`);
    console.log(`   Scheduled: ${stats.scheduled}`);
    console.log(`   With Platform ID: ${stats.withPlatformId}`);
    console.log(`   With Errors: ${stats.withErrors}`);
    console.log(`   With Responses: ${stats.withResponses}`);

  } catch (error) {
    console.error('❌ Error checking post details:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPostDetails();