/**
 * Script to configure Twitter OAuth 2.0 credentials
 * OAuth 2.0 provides higher rate limits (100 tweets/day vs 50/day)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function configureOAuth2() {
  console.log('🐦 Twitter OAuth 2.0 Configuration\n');
  
  const configs = [
    {
      key: 'x_oauth2_client_id',
      value: process.env.TWITTER_OAUTH2_CLIENT_ID || '',
    },
    {
      key: 'x_oauth2_client_secret',
      value: process.env.TWITTER_OAUTH2_CLIENT_SECRET || '',
    },
    {
      key: 'x_oauth2_access_token',
      value: process.env.TWITTER_OAUTH2_ACCESS_TOKEN || '',
    },
    {
      key: 'x_oauth2_refresh_token',
      value: process.env.TWITTER_OAUTH2_REFRESH_TOKEN || '',
    },
    {
      key: 'twitter_auth_method',
      value: process.env.TWITTER_AUTH_METHOD || 'oauth1',
    }
  ];

  console.log('💾 Saving configuration to database...\n');

  for (const config of configs) {
    await prisma.config.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: { key: config.key, value: config.value }
    });
    
    const masked = config.value ? 
      (config.value.length > 10 ? config.value.substring(0, 10) + '...' : '***') 
      : '(not set)';
    
    console.log(`✅ ${config.key}: ${masked}`);
  }

  console.log('\n📊 Current Configuration:');
  const allConfigs = await prisma.config.findMany({
    where: {
      key: {
        startsWith: 'x_oauth'
      }
    }
  });

  allConfigs.forEach(c => {
    const value = c.value ? 
      (c.value.length > 10 ? c.value.substring(0, 10) + '...' : '***') 
      : '(not set)';
    console.log(`   ${c.key}: ${value}`);
  });

  const authMethod = await prisma.config.findUnique({
    where: { key: 'twitter_auth_method' }
  });
  
  console.log(`\n🔐 Active Auth Method: ${authMethod?.value || 'oauth1 (default)'}`);
  console.log('\n💡 Rate Limits:');
  console.log('   OAuth 1.0a: ~50 tweets/day (Free tier)');
  console.log('   OAuth 2.0:  100 tweets/day (Free tier)');
  console.log('   OAuth 2.0:  Unlimited with Basic+ plans\n');

  await prisma.$disconnect();
}

configureOAuth2().catch(console.error);
