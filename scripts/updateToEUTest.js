import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function updateConfig() {
  try {
    console.log('Updating HyperPay configuration for EU test server...\n');
    
    // Update entity ID
    await prisma.config.upsert({
      where: { key: 'HYPERPAY_ENTITY_ID' },
      update: { value: '8ac7a4c994aeea4d0194b1e58b280403' },
      create: { key: 'HYPERPAY_ENTITY_ID', value: '8ac7a4c994aeea4d0194b1e58b280403' }
    });
    console.log('✅ Updated HYPERPAY_ENTITY_ID');
    
    // Update mode to EU test
    await prisma.config.upsert({
      where: { key: 'HYPERPAY_MODE' },
      update: { value: 'eu-test' },
      create: { key: 'HYPERPAY_MODE', value: 'eu-test' }
    });
    console.log('✅ Updated HYPERPAY_MODE to eu-test');
    
    // Show final config
    const configs = await prisma.config.findMany({
      where: { key: { startsWith: 'HYPERPAY' } }
    });
    
    console.log('\n📋 Current HyperPay Configuration:');
    configs.forEach(c => {
      const displayValue = c.key === 'HYPERPAY_ACCESS_TOKEN' 
        ? '***' + c.value.slice(-4) 
        : c.value;
      console.log(`   ${c.key}: ${displayValue}`);
    });
    
    console.log('\n✅ Configuration updated successfully!');
    console.log('   Restart the server for changes to take effect.\n');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateConfig();
