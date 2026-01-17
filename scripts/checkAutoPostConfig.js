import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAutoPostConfig() {
  try {
    const config = await prisma.config.findUnique({
      where: { key: 'auto_post_enabled' }
    });
    
    console.log('\n🔍 Auto-Post Configuration Check:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!config) {
      console.log('❌ auto_post_enabled not found in database');
      console.log('💡 This will be created when you toggle Auto-Post in the UI');
    } else {
      const isEnabled = config.value === 'true';
      console.log('✅ Config found in database');
      console.log('Key:', config.key);
      console.log('Value:', config.value);
      console.log('Status:', isEnabled ? '🟢 ENABLED' : '🔴 DISABLED');
      console.log('Last Updated:', config.updatedAt.toLocaleString());
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAutoPostConfig();
