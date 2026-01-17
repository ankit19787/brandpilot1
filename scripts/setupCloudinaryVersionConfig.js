import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupCloudinaryVersionConfig() {
  try {
    const cloudinaryApiVersion = await prisma.config.findUnique({
      where: { key: 'cloudinary_api_version' }
    });
    
    if (!cloudinaryApiVersion) {
      await prisma.config.create({
        data: {
          key: 'cloudinary_api_version',
          value: 'v1_1'
        }
      });
      console.log('✅ Created cloudinary_api_version config: v1_1');
    } else {
      console.log(`✅ cloudinary_api_version already exists: ${cloudinaryApiVersion.value}`);
    }
    
    console.log('\n📋 Updated Cloudinary Configuration:');
    const configs = await prisma.config.findMany({
      where: {
        key: {
          in: ['cloudinary_api_url', 'cloudinary_api_version', 'cloudinary_cloud_name', 'cloudinary_api_key', 'cloudinary_api_secret']
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
    
    console.log('\n🔗 Sample Dynamic URL Construction:');
    const cloudName = configs.find(c => c.key === 'cloudinary_cloud_name')?.value || 'your_cloud_name';
    const apiUrl = configs.find(c => c.key === 'cloudinary_api_url')?.value || 'https://api.cloudinary.com';
    const apiVersion = configs.find(c => c.key === 'cloudinary_api_version')?.value || 'v1_1';
    
    console.log(`├─ Upload URL: ${apiUrl}/${apiVersion}/${cloudName}/image/upload`);
    console.log(`├─ List URL: ${apiUrl}/${apiVersion}/${cloudName}/resources/image`);
    console.log(`└─ Delete URL: ${apiUrl}/${apiVersion}/${cloudName}/resources/image/upload`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setupCloudinaryVersionConfig();