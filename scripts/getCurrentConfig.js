import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function getCurrentConfig() {
  const configs = await prisma.config.findMany();
  console.log(JSON.stringify(configs, null, 2));
  await prisma.$disconnect();
}

getCurrentConfig();
