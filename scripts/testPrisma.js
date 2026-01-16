import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPrisma() {
  // Create a test user
  const user = await prisma.user.create({
    data: {
      username: 'testuser',
      passwordHash: 'hashedpassword',
      role: 'user',
    },
  });
  console.log('Created user:', user);

  // Fetch all users
  const users = await prisma.user.findMany();
  console.log('All users:', users);
}

testPrisma()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
