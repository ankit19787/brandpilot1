import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function updateCredentials() {
  try {
    await prisma.config.upsert({
      where: { key: 'x_api_key' },
      update: { value: 'HflU4WImFWhstYLkJXpsEBkDU' },
      create: { key: 'x_api_key', value: 'HflU4WImFWhstYLkJXpsEBkDU' }
    });

    await prisma.config.upsert({
      where: { key: 'x_api_secret' },
      update: { value: 'SJAxdxRYggpVhUteAX96k7NOX3520PNoUmgjMDiAQbdILdh9wv' },
      create: { key: 'x_api_secret', value: 'SJAxdxRYggpVhUteAX96k7NOX3520PNoUmgjMDiAQbdILdh9wv' }
    });

    await prisma.config.upsert({
      where: { key: 'x_access_token' },
      update: { value: '1995694849396502528-dKhySjeOvaw4O3RbDczYY1G11RQ8io' },
      create: { key: 'x_access_token', value: '1995694849396502528-dKhySjeOvaw4O3RbDczYY1G11RQ8io' }
    });

    await prisma.config.upsert({
      where: { key: 'x_access_secret' },
      update: { value: '9ajfYpuiaHyYZxk85DvrU6Zx778juimWuJHwXgkHZcbdq' },
      create: { key: 'x_access_secret', value: '9ajfYpuiaHyYZxk85DvrU6Zx778juimWuJHwXgkHZcbdq' }
    });

    console.log('✅ All Twitter credentials updated successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateCredentials();
