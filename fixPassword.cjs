const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

async function fixPasswordHash() {
  try {
    const passwordHash = crypto.createHash('sha256').update('admin123').digest('hex');
    await prisma.user.update({
      where: { username: 'ankit' },
      data: { passwordHash }
    });
    console.log('✅ Password hash updated for user ankit');
    console.log('New hash:', passwordHash);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixPasswordHash();
