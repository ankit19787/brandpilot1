import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupCloudinaryConfig() {
  try {
    const cloudinaryApiUrl = await prisma.config.findUnique({
      where: { key: 'cloudinary_api_url' }
    });
    
    if (!cloudinaryApiUrl) {
      await prisma.config.create({
        data: {
          key: 'cloudinary_api_url',
          value: 'https://api.cloudinary.com'
        }
      });
      console.log('✅ Created cloudinary_api_url config: https://api.cloudinary.com');
    } else {
      console.log(`✅ cloudinary_api_url already exists: ${cloudinaryApiUrl.value}`);
    }
    
    console.log('\n📋 Current Cloudinary Configuration:');
    const configs = await prisma.config.findMany({
      where: {
        key: {
          in: ['cloudinary_api_url', 'cloudinary_cloud_name', 'cloudinary_api_key', 'cloudinary_api_secret']
        }
      }
    });
    
    configs.forEach(config => {
      if (config.key.includes('secret')) {
        console.log(`├─ ${config.key}: ${'*'.repeat(config.value?.length || 0)}`);
      } else {
        console.log(`├─ ${config.key}: ${config.value || 'Not set'}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setupCloudinaryConfig();