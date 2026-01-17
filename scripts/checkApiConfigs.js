import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkApiConfigs() {
  try {
    const configs = await prisma.config.findMany({
      where: {
        key: {
          in: ['facebook_api_url', 'instagram_api_url', 'facebook_api_version']
        }
      }
    });
    
    console.log('Current API URL Configurations:');
    if (configs.length > 0) {
      configs.forEach(config => {
        console.log(`${config.key}: ${config.value}`);
      });
    } else {
      console.log('No API URL configurations found.');
    }
    
    // Set defaults if missing
    const requiredConfigs = [
      { key: 'facebook_api_url', value: 'https://graph.facebook.com' },
      { key: 'instagram_api_url', value: 'https://graph.facebook.com' },
      { key: 'facebook_api_version', value: 'v20.0' }
    ];
    
    for (const config of requiredConfigs) {
      const existing = await prisma.config.findUnique({
        where: { key: config.key }
      });
      
      if (!existing) {
        await prisma.config.create({
          data: config
        });
        console.log(`✅ Created config: ${config.key} = ${config.value}`);
      }
    }
    
    console.log('✅ All API URL configurations are set');
    
  } catch (error) {
    console.error('Error checking API configurations:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkApiConfigs();