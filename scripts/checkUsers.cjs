const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.user.findMany();
  console.log('Users:', users.map(u => ({ id: u.id, username: u.username })));
  await prisma.$disconnect();
}

checkUsers();