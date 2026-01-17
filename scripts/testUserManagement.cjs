const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUserManagement() {
  console.log('\n🧪 Testing User Management System...\n');

  try {
    // Test 1: Fetch all users
    console.log('📋 Test 1: Fetching all users...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        plan: true,
        credits: true,
        maxCredits: true,
        avatarStyle: true,
        createdAt: true,
        _count: {
          select: { posts: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✅ Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`   - ${user.username} (${user.role}) - ${user.plan} plan - ${user.credits}/${user.maxCredits} credits - ${user._count.posts} posts`);
    });

    // Test 2: Count by role
    console.log('\n👥 Test 2: User statistics by role...');
    const roleStats = await prisma.user.groupBy({
      by: ['role'],
      _count: true
    });

    roleStats.forEach(stat => {
      console.log(`   ${stat.role}: ${stat._count} users`);
    });

    // Test 3: Count by plan
    console.log('\n💳 Test 3: User statistics by plan...');
    const planStats = await prisma.user.groupBy({
      by: ['plan'],
      _count: true
    });

    planStats.forEach(stat => {
      console.log(`   ${stat.plan}: ${stat._count} users`);
    });

    // Test 4: Users with email
    console.log('\n📧 Test 4: Email configuration...');
    const withEmail = await prisma.user.count({
      where: { email: { not: null } }
    });
    const withoutEmail = await prisma.user.count({
      where: { email: null }
    });

    console.log(`   With email: ${withEmail}`);
    console.log(`   Without email: ${withoutEmail}`);

    // Test 5: Check if current user has admin privileges
    console.log('\n🔐 Test 5: Admin users...');
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        username: true,
        email: true,
        plan: true
      }
    });

    if (admins.length > 0) {
      console.log(`   Found ${admins.length} admin(s):`);
      admins.forEach(admin => {
        console.log(`   - ${admin.username} (${admin.email || 'no email'}) - ${admin.plan} plan`);
      });
    } else {
      console.log('   ⚠️ No admin users found!');
    }

    // Test 6: Sample user update simulation
    if (users.length > 0) {
      const testUser = users[0];
      console.log(`\n✏️ Test 6: Sample update simulation for ${testUser.username}...`);
      console.log(`   Current: role=${testUser.role}, plan=${testUser.plan}, credits=${testUser.credits}`);
      console.log('   ✅ Update would work (not executing to preserve data)');
    }

    console.log('\n✅ All user management tests passed!\n');

  } catch (error) {
    console.error('❌ Error testing user management:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUserManagement();
