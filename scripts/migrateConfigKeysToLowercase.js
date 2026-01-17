// Script to migrate configuration keys from UPPERCASE to lowercase
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateConfigKeys() {
  console.log('🔄 Migrating configuration keys to lowercase format...\n');

  // Mapping of old UPPERCASE keys to new lowercase keys
  const keyMappings = {
    // HyperPay keys
    'HYPERPAY_ENTITY_ID': 'hyperpay_entity_id',
    'HYPERPAY_ACCESS_TOKEN': 'hyperpay_access_token',
    'HYPERPAY_MODE': 'hyperpay_mode',
    'HYPERPAY_BRANDS': 'hyperpay_brands',
    
    // Email keys
    'EMAIL_HOST': 'email_host',
    'EMAIL_PORT': 'email_port',
    'EMAIL_SECURE': 'email_secure',
    'EMAIL_USER': 'email_user',
    'EMAIL_PASS': 'email_pass',
    'EMAIL_FROM': 'email_from'
  };

  try {
    // Check for existing uppercase keys
    const oldKeys = Object.keys(keyMappings);
    const existingConfigs = await prisma.config.findMany({
      where: {
        key: { in: oldKeys }
      }
    });

    if (existingConfigs.length === 0) {
      console.log('✅ No uppercase configuration keys found. Migration not needed.\n');
      return;
    }

    console.log(`Found ${existingConfigs.length} uppercase configuration keys to migrate:\n`);
    
    // Migrate each configuration
    for (const config of existingConfigs) {
      const newKey = keyMappings[config.key];
      
      try {
        // Create new lowercase key with same value
        await prisma.config.upsert({
          where: { key: newKey },
          update: { value: config.value },
          create: { key: newKey, value: config.value }
        });

        // Delete old uppercase key
        await prisma.config.delete({
          where: { key: config.key }
        });

        const displayValue = newKey.includes('token') || newKey.includes('pass')
          ? '***' + config.value.slice(-4)
          : config.value;

        console.log(`✅ Migrated: ${config.key} → ${newKey}: ${displayValue}`);
        
      } catch (error) {
        console.error(`❌ Failed to migrate ${config.key}:`, error.message);
      }
    }

    console.log('\n🎉 Configuration key migration completed!');
    console.log('\n📋 Current configuration keys:');
    
    // Show all current config keys
    const allConfigs = await prisma.config.findMany({
      orderBy: { key: 'asc' }
    });
    
    allConfigs.forEach(config => {
      const displayValue = config.key.includes('token') || config.key.includes('pass')
        ? '***' + config.value.slice(-4)
        : config.value;
      console.log(`  ${config.key}: ${displayValue}`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateConfigKeys().catch(console.error);