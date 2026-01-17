import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

async function testEmailNotification() {
  try {
    console.log('\n=== Testing Email Notification on Post Update ===\n');
    
    // Find admin user
    const user = await prisma.user.findFirst({
      where: { email: { not: null } }
    });
    
    if (!user) {
      console.log('❌ No user with email found!');
      console.log('Run: node scripts/updateUserEmail.js <username> <email>\n');
      return;
    }
    
    console.log(`Found user: ${user.username} (${user.email})`);
    
    // Create a test post
    console.log('\nCreating test post...');
    const post = await prisma.post.create({
      data: {
        userId: user.id,
        platform: 'X (Twitter)',
        content: 'Test post for email notification - ' + new Date().toISOString(),
        status: 'draft',
        scheduledFor: new Date()
      }
    });
    
    console.log(`✅ Post created: ${post.id}`);
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update post to published status via API
    console.log('\nUpdating post to "published" status via API...');
    const response = await fetch(`http://localhost:3001/api/posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'published',
        platformPostId: 'test_' + Date.now()
      })
    });
    
    if (!response.ok) {
      console.log('❌ API request failed:', response.status);
      const error = await response.text();
      console.log(error);
      return;
    }
    
    const updatedPost = await response.json();
    console.log('✅ Post updated:', updatedPost.status);
    
    console.log('\n📧 Check server console logs for email sending status');
    console.log('📧 Check your inbox:', user.email);
    console.log('\nIf no email received, check:');
    console.log('  1. Server console for email errors');
    console.log('  2. Gmail spam folder');
    console.log('  3. Email configuration: node scripts/checkEmailConfig.js\n');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3001/api/config');
    return response.ok;
  } catch {
    return false;
  }
}

const serverRunning = await checkServer();
if (!serverRunning) {
  console.log('\n❌ Server is not running on port 3001!');
  console.log('Start server first: node server.js\n');
  process.exit(1);
}

testEmailNotification();
