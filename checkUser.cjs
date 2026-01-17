const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({ where: { username: 'ankit' } });
    if (user) {
      console.log('✅ User found:', JSON.stringify({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        plan: user.plan,
        credits: user.credits,
        passwordHashExists: !!user.passwordHash
      }, null, 2));
      
      // Check if the password hash matches
      const testPasswordHash = crypto.createHash('sha256').update('admin123').digest('hex');
      console.log('Expected hash:', testPasswordHash);
      console.log('Actual hash:', user.passwordHash);
      console.log('Password hash matches:', user.passwordHash === testPasswordHash);
    } else {
      console.log('❌ User "ankit" not found - need to create user first');
      
      // Create the user
      console.log('Creating user "ankit"...');
      const passwordHash = crypto.createHash('sha256').update('admin123').digest('hex');
      const newUser = await prisma.user.create({
        data: {
          username: 'ankit',
          passwordHash,
          email: 'ankit@example.com',
          role: 'admin',
          plan: 'enterprise',
          credits: 100000,
          maxCredits: 100000,
          avatarStyle: Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
        }
      });
      console.log('✅ User created:', JSON.stringify({
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        plan: newUser.plan,
        credits: newUser.credits
      }, null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();