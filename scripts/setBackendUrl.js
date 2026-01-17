import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function setBackendUrl() {
  try {
    const backendUrl = 'http://localhost:3001';
    
    await prisma.config.upsert({
      where: { key: 'backend_api_url' },
      update: { value: backendUrl },
      create: { key: 'backend_api_url', value: backendUrl }
    });
    
    console.log(`✅ Backend API URL set to: ${backendUrl}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setBackendUrl();
