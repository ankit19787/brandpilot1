// Script to update a single HyperPay configuration value
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateHyperPayConfig() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node scripts/updateHyperPayConfig.js <KEY> <VALUE>');
    console.log('\nAvailable keys:');
    console.log('  HYPERPAY_ENTITY_ID      - Your HyperPay Entity ID');
    console.log('  HYPERPAY_ACCESS_TOKEN   - Your HyperPay Access Token');
    console.log('  HYPERPAY_MODE           - test or live');
    console.log('  HYPERPAY_BRANDS         - VISA,MASTER,MADA');
    console.log('\nExample:');
    console.log('  node scripts/updateHyperPayConfig.js HYPERPAY_ENTITY_ID "8ac7a4c882f47e760182f52f66f81234"');
    process.exit(1);
  }

  const [key, value] = args;
  
  const validKeys = ['HYPERPAY_ENTITY_ID', 'HYPERPAY_ACCESS_TOKEN', 'HYPERPAY_MODE', 'HYPERPAY_BRANDS'];
  
  if (!validKeys.includes(key)) {
    console.error(`❌ Invalid key: ${key}`);
    console.log(`Valid keys: ${validKeys.join(', ')}`);
    process.exit(1);
  }

  try {
    const config = await prisma.config.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
    
    const displayValue = key === 'HYPERPAY_ACCESS_TOKEN' 
      ? value.substring(0, 10) + '...' 
      : value;
    
    console.log(`✅ Updated ${key} to: ${displayValue}`);
    
    // Show all HyperPay configs
    console.log('\n📋 Current HyperPay Configuration:');
    const allConfigs = await prisma.config.findMany({
      where: {
        key: { in: validKeys }
      }
    });
    
    allConfigs.forEach(c => {
      const val = c.key === 'HYPERPAY_ACCESS_TOKEN' 
        ? c.value.substring(0, 10) + '...' 
        : c.value;
      console.log(`  ${c.key}: ${val}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to update config:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateHyperPayConfig();
