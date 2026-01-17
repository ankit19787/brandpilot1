import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserEmails() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true
      }
    });
    
    console.log('\n=== User Email Status ===\n');
    users.forEach(user => {
      console.log(`User: ${user.username}`);
      console.log(`Email: ${user.email || '❌ NO EMAIL SET'}`);
      console.log('---');
    });
    
    const usersWithEmail = users.filter(u => u.email);
    const usersWithoutEmail = users.filter(u => !u.email);
    
    console.log(`\nTotal Users: ${users.length}`);
    console.log(`Users WITH email: ${usersWithEmail.length}`);
    console.log(`Users WITHOUT email: ${usersWithoutEmail.length}`);
    
    if (usersWithoutEmail.length > 0) {
      console.log('\n⚠️  Users without email will NOT receive notifications!');
      console.log('To add email, update profile or run update script.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserEmails();
