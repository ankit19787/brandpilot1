// Script to configure HyperPay payment settings in database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function configureHyperPay() {
  console.log('🔧 Configuring HyperPay Payment Settings...\n');

  // HyperPay configuration values
  const configs = [
    {
      key: 'HYPERPAY_ENTITY_ID',
      value: 'your_entity_id_here',
      description: 'HyperPay Entity ID from dashboard'
    },
    {
      key: 'HYPERPAY_ACCESS_TOKEN',
      value: 'your_access_token_here',
      description: 'HyperPay Access Token from dashboard'
    },
    {
      key: 'HYPERPAY_MODE',
      value: 'test',
      description: 'Payment mode: test or live'
    },
    {
      key: 'HYPERPAY_BRANDS',
      value: 'VISA,MASTER,MADA',
      description: 'Supported payment brands (comma-separated)'
    }
  ];

  console.log('📝 Creating/updating HyperPay configuration...\n');

  for (const config of configs) {
    try {
      const result = await prisma.config.upsert({
        where: { key: config.key },
        update: { value: config.value },
        create: { 
          key: config.key, 
          value: config.value 
        }
      });
      
      console.log(`✅ ${config.key}: ${config.value}`);
      console.log(`   Description: ${config.description}\n`);
    } catch (error) {
      console.error(`❌ Failed to set ${config.key}:`, error.message);
    }
  }

  console.log('\n📋 Current HyperPay Configuration:');
  console.log('=' .repeat(60));
  
  const allConfigs = await prisma.config.findMany({
    where: {
      key: {
        in: ['HYPERPAY_ENTITY_ID', 'HYPERPAY_ACCESS_TOKEN', 'HYPERPAY_MODE', 'HYPERPAY_BRANDS']
      }
    }
  });

  allConfigs.forEach(c => {
    const displayValue = c.key === 'HYPERPAY_ACCESS_TOKEN' 
      ? c.value.substring(0, 10) + '...' 
      : c.value;
    console.log(`${c.key}: ${displayValue}`);
  });

  console.log('\n⚠️  IMPORTANT: Update the values above with your actual HyperPay credentials!');
  console.log('\nTo update a specific value, you can use:');
  console.log('node scripts/updateHyperPayConfig.js HYPERPAY_ENTITY_ID "your_entity_id"\n');

  await prisma.$disconnect();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  configureHyperPay().catch(console.error);
}

export default configureHyperPay;
