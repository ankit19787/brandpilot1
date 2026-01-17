import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnosisEmailIssue() {
  console.log('\n=== EMAIL NOTIFICATION DIAGNOSIS ===\n');
  
  try {
    // 1. Check email configuration
    console.log('1️⃣ EMAIL CONFIGURATION');
    console.log('───────────────────────');
    const emailConfigs = await prisma.config.findMany({
      where: { key: { startsWith: 'EMAIL_' } }
    });
    
    const configMap = {};
    emailConfigs.forEach(c => {
      configMap[c.key] = c.value;
      const display = c.key.includes('PASS') ? '***hidden***' : c.value;
      console.log(`  ${c.key}: ${display}`);
    });
    
    const emailConfigured = configMap.EMAIL_HOST && configMap.EMAIL_USER && configMap.EMAIL_PASS;
    console.log(`  Status: ${emailConfigured ? '✅ Configured' : '❌ Not Configured'}\n`);
    
    // 2. Check users with emails
    console.log('2️⃣ USERS WITH EMAIL ADDRESSES');
    console.log('───────────────────────────────');
    const users = await prisma.user.findMany({
      select: { id: true, username: true, email: true }
    });
    
    users.forEach(user => {
      const emailStatus = user.email ? '✅' : '❌';
      console.log(`  ${emailStatus} ${user.username}: ${user.email || 'NO EMAIL'}`);
    });
    
    const usersWithEmail = users.filter(u => u.email);
    console.log(`  Total: ${usersWithEmail.length}/${users.length} users have email\n`);
    
    // 3. Check recent posts and their user emails
    console.log('3️⃣ RECENT POSTS (Last 5)');
    console.log('──────────────────────────');
    const recentPosts = await prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { username: true, email: true } } }
    });
    
    recentPosts.forEach((post, index) => {
      const emailStatus = post.user.email ? '📧' : '❌';
      console.log(`  ${index + 1}. ${post.platform} - ${post.status}`);
      console.log(`     User: ${post.user.username}`);
      console.log(`     Email: ${emailStatus} ${post.user.email || 'NO EMAIL'}`);
      console.log(`     Created: ${post.createdAt.toLocaleString()}`);
      console.log('');
    });
    
    // 4. Summary and recommendations
    console.log('4️⃣ DIAGNOSIS SUMMARY');
    console.log('─────────────────────');
    
    if (!emailConfigured) {
      console.log('  ❌ Email service is NOT configured');
      console.log('  → Run: node scripts/configureEmail.js\n');
      return;
    }
    
    if (usersWithEmail.length === 0) {
      console.log('  ❌ NO users have email addresses');
      console.log('  → Add email via Profile Settings in the app');
      console.log('  → Or run: node scripts/updateUserEmail.js <username> <email>\n');
      return;
    }
    
    const recentPostsWithoutEmail = recentPosts.filter(p => !p.user.email);
    if (recentPostsWithoutEmail.length > 0) {
      console.log(`  ⚠️  ${recentPostsWithoutEmail.length} recent posts by users WITHOUT email`);
      console.log('  → These users will NOT receive notifications');
      console.log('  → Update their profiles to add email addresses\n');
    }
    
    console.log('  ✅ Email system is configured correctly');
    console.log('  ✅ Some users have email addresses');
    console.log('  → Emails will be sent when these users\' posts are published/failed\n');
    
    // Check if there's a logged-in admin
    const admin = users.find(u => u.username === 'admin' && u.email);
    if (admin) {
      console.log(`  📧 Admin email: ${admin.email}`);
      console.log('  → Make sure you\'re logged in as admin when creating posts\n');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnosisEmailIssue();
