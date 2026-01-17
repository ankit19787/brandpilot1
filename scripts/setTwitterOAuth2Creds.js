/**
 * Set Twitter OAuth 2.0 credentials
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setCredentials() {
  console.log('🐦 Setting Twitter OAuth 2.0 Credentials...\n');
  
  const credentials = [
    {
      key: 'x_oauth2_client_id',
      value: 'Y3F6TUtSMUh6X3JGaGRkdllPZ1c6MTpjaQ'
    },
    {
      key: 'x_oauth2_client_secret',
      value: 'khK6ik6FhbCYiRSZmU6S6ey3YiDAzWd4M5_uZRe34klt-Z4-pV'
    },
    {
      key: 'twitter_auth_method',
      value: 'oauth2'
    }
  ];

  for (const cred of credentials) {
    await prisma.config.upsert({
      where: { key: cred.key },
      update: { value: cred.value },
      create: cred
    });
    
    const display = cred.key === 'twitter_auth_method' ? cred.value : 
                    cred.value.substring(0, 15) + '...';
    console.log(`✅ ${cred.key}: ${display}`);
  }

  console.log('\n⚠️  Note: You still need to get an access token via OAuth 2.0 flow');
  console.log('   See TWITTER_OAUTH2_GUIDE.md for instructions\n');

  await prisma.$disconnect();
}

setCredentials().catch(console.error);
