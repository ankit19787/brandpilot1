import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAuthMethod() {
  const authMethod = await prisma.config.findUnique({
    where: { key: 'twitter_auth_method' }
  });
  
  const oauth2Token = await prisma.config.findUnique({
    where: { key: 'x_oauth2_access_token' }
  });
  
  const oauth2Refresh = await prisma.config.findUnique({
    where: { key: 'x_oauth2_refresh_token' }
  });
  
  console.log('\n🐦 Twitter Authentication Configuration\n');
  console.log('Auth Method:', authMethod?.value || 'oauth1');
  console.log('OAuth 2.0 Access Token:', oauth2Token?.value ? '✅ SET' : '❌ NOT SET');
  console.log('OAuth 2.0 Refresh Token:', oauth2Refresh?.value ? '✅ SET' : '❌ NOT SET');
  
  await prisma.$disconnect();
}

checkAuthMethod();
