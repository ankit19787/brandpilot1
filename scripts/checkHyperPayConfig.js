import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkHyperPayConfig() {
  try {
    console.log('\n🔍 Checking HyperPay Configuration...\n');
    
    const configs = await prisma.config.findMany({
      where: {
        key: {
          startsWith: 'hyperpay'
        }
      }
    });
    
    if (configs.length === 0) {
      console.log('❌ No HyperPay configuration found in database!');
      console.log('\nTo configure HyperPay, run:');
      console.log('  node scripts/configureHyperPay.js\n');
      return;
    }
    
    console.log('Found HyperPay configurations:');
    configs.forEach(config => {
      const displayValue = config.key === 'hyperpay_access_token' 
        ? '***' + config.value.slice(-4) 
        : config.value;
      console.log(`  ${config.key}: ${displayValue}`);
    });
    
    // Check if all required fields are present
    const requiredKeys = ['hyperpay_entity_id', 'hyperpay_access_token'];
    const foundKeys = configs.map(c => c.key);
    const missingKeys = requiredKeys.filter(k => !foundKeys.includes(k));
    
    if (missingKeys.length > 0) {
      console.log('\n⚠️  Missing required configurations:', missingKeys.join(', '));
      console.log('\nTo configure HyperPay, run:');
      console.log('  node scripts/configureHyperPay.js\n');
    } else {
      console.log('\n✅ HyperPay is configured!\n');
      
      const configMap = {};
      configs.forEach(c => configMap[c.key] = c.value);
      
      const mode = configMap.hyperpay_mode || 'test';
      const baseUrl = mode === 'live' 
        ? 'https://oppwa.com/v1'
        : 'https://test.oppwa.com/v1';
      
      console.log('Mode:', mode);
      console.log('Base URL:', baseUrl);
      console.log('Entity ID:', configMap.hyperpay_entity_id);
      console.log('Brands:', configMap.hyperpay_brands || 'VISA,MASTER');
    }
    
  } catch (error) {
    console.error('Error checking HyperPay config:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkHyperPayConfig();
