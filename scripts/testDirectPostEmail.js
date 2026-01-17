import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDirectPostEmail() {
  try {
    console.log('\n=== Testing Email on Direct Post Publishing ===\n');
    
    // Find admin user
    const user = await prisma.user.findFirst({
      where: { email: { not: null } }
    });
    
    if (!user) {
      console.log('❌ No user with email found!');
      return;
    }
    
    console.log(`Found user: ${user.username} (${user.email})`);
    
    // Simulate direct publish (what happens in UI when user clicks "Publish Now")
    console.log('\nSimulating direct post publish (like Production Publish button)...');
    
    const postData = {
      userId: user.id,
      platform: 'Instagram',
      content: 'Testing direct email notification - Published at ' + new Date().toLocaleString(),
      imageUrl: 'https://example.com/test.jpg',
      status: 'published', // Direct publish, not scheduled
      scheduledFor: null
    };
    
    console.log('Creating post with status: published (directly)...');
    const response = await fetch('http://localhost:3001/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.log('❌ API request failed:', response.status);
      console.log(error);
      return;
    }
    
    const createdPost = await response.json();
    console.log('✅ Post created:', createdPost.id);
    console.log('   Status:', createdPost.status);
    console.log('   Platform:', createdPost.platform);
    
    console.log('\n📧 Email should be sent immediately!');
    console.log('📧 Check server console for:');
    console.log('   "📧 Sending email notification for directly published post..."');
    console.log('   "✅ Email notification sent successfully"');
    console.log('\n📧 Check your inbox:', user.email);
    console.log('\nIf no email received:');
    console.log('   1. Check server console logs above');
    console.log('   2. Check Gmail spam folder');
    console.log('   3. Verify server is running: check terminal\n');
    
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

testDirectPostEmail();
