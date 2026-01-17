import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEmailConfig() {
  try {
    const configs = await prisma.config.findMany({
      where: {
        key: {
          startsWith: 'EMAIL_'
        }
      }
    });
    
    console.log('\n=== Email Configuration Status ===\n');
    
    if (configs.length === 0) {
      console.log('❌ NO EMAIL CONFIGURATION FOUND!');
      console.log('\nTo configure email, run:');
      console.log('  node scripts/configureEmail.js\n');
      return;
    }
    
    const required = ['EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASS'];
    const configMap = {};
    
    configs.forEach(c => {
      configMap[c.key] = c.value;
      const displayValue = c.key.includes('PASS') ? '***hidden***' : c.value;
      console.log(`${c.key}: ${displayValue}`);
    });
    
    console.log('\n--- Validation ---');
    required.forEach(key => {
      const status = configMap[key] ? '✅' : '❌';
      console.log(`${status} ${key}`);
    });
    
    const allConfigured = required.every(key => configMap[key]);
    
    if (allConfigured) {
      console.log('\n✅ Email service is properly configured!');
      console.log('Emails will be sent for post updates.\n');
    } else {
      console.log('\n❌ Email service is NOT properly configured!');
      console.log('Missing required configuration.\n');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmailConfig();
