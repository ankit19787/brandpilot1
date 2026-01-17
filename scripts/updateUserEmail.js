import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateUserEmail() {
  const username = process.argv[2];
  const email = process.argv[3];
  
  if (!username || !email) {
    console.log('\n❌ Usage: node scripts/updateUserEmail.js <username> <email>\n');
    console.log('Example: node scripts/updateUserEmail.js testuser user@example.com\n');
    process.exit(1);
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.log('\n❌ Invalid email format!\n');
    process.exit(1);
  }
  
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { username }
    });
    
    if (!user) {
      console.log(`\n❌ User "${username}" not found!\n`);
      console.log('Available users:');
      const allUsers = await prisma.user.findMany({ select: { username: true } });
      allUsers.forEach(u => console.log(`  - ${u.username}`));
      process.exit(1);
    }
    
    // Update user email
    const updatedUser = await prisma.user.update({
      where: { username },
      data: { email }
    });
    
    console.log('\n✅ Email updated successfully!\n');
    console.log(`User: ${updatedUser.username}`);
    console.log(`Email: ${updatedUser.email}`);
    console.log('\n📧 This user will now receive email notifications for:');
    console.log('  - Posts published');
    console.log('  - Posts failed');
    console.log('  - Payment confirmations');
    console.log('  - Plan upgrades');
    console.log('  - Low credits warnings');
    console.log('  - Brand DNA generated\n');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserEmail();
