import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkTwitterConfig() {
  try {
    const keys = [
      'x_api_key',
      'x_api_secret',
      'x_access_token',
      'x_access_secret',
      'twitter_api_url',
      'backend_api_url'
    ];
    
    const configs = await prisma.config.findMany({
      where: {
        key: {
          in: keys
        }
      }
    });
    
    console.log('Twitter/X Configuration in Database:');
    console.log('=====================================');
    
    keys.forEach(key => {
      const config = configs.find(c => c.key === key);
      if (config && config.value) {
        const maskedValue = key.includes('secret') || key.includes('token') 
          ? config.value.substring(0, 10) + '...' 
          : config.value;
        console.log(`✅ ${key}: ${maskedValue}`);
      } else {
        console.log(`❌ ${key}: NOT SET`);
      }
    });
    
    console.log('\nAll Config Keys in DB:');
    const allConfigs = await prisma.config.findMany();
    allConfigs.forEach(c => console.log(`  - ${c.key}`));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTwitterConfig();
