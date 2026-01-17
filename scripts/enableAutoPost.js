import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function enableAutoPost() {
  try {
    const config = await prisma.config.upsert({
      where: { key: 'auto_post_enabled' },
      update: { value: 'true' },
      create: { key: 'auto_post_enabled', value: 'true' }
    });
    
    console.log('\n✅ Auto-Post ENABLED successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Key:', config.key);
    console.log('Value:', config.value);
    console.log('Status: 🟢 ENABLED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 Auto-post will now monitor scheduled posts every 5 seconds');
    console.log('📅 Refresh the app to see the change in the UI\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

enableAutoPost();
