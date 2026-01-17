import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function configureEmail() {
  console.log('🔧 Configuring Email Service...\n');

  const emailConfigs = [
    {
      key: 'EMAIL_HOST',
      value: process.argv[2] || 'smtp.gmail.com',
      description: 'SMTP host (e.g., smtp.gmail.com, smtp.office365.com)'
    },
    {
      key: 'EMAIL_PORT',
      value: process.argv[3] || '587',
      description: 'SMTP port (587 for TLS, 465 for SSL)'
    },
    {
      key: 'EMAIL_SECURE',
      value: process.argv[4] || 'false',
      description: 'Use SSL (true for port 465, false for port 587)'
    },
    {
      key: 'EMAIL_USER',
      value: process.argv[5] || '',
      description: 'Email account username'
    },
    {
      key: 'EMAIL_PASS',
      value: process.argv[6] || '',
      description: 'Email account password or app password'
    },
    {
      key: 'EMAIL_FROM',
      value: process.argv[7] || 'noreply@brandpilot.com',
      description: 'From email address'
    }
  ];

  for (const config of emailConfigs) {
    const result = await prisma.config.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: { key: config.key, value: config.value }
    });
    
    console.log(`✅ ${config.key}: ${config.value ? (config.key.includes('PASS') ? '***hidden***' : config.value) : '(not set)'}`);
  }

  console.log('\n📧 Email Configuration Complete!');
  console.log('\nUsage Examples:');
  console.log('  Default Gmail setup:');
  console.log('    node scripts/configureEmail.js smtp.gmail.com 587 false your-email@gmail.com your-app-password');
  console.log('\n  Office 365:');
  console.log('    node scripts/configureEmail.js smtp.office365.com 587 false your-email@company.com your-password');
  console.log('\n  Custom SMTP:');
  console.log('    node scripts/configureEmail.js mail.example.com 465 true user@example.com password noreply@example.com');
  console.log('\nNote: For Gmail, create an App Password at https://myaccount.google.com/apppasswords\n');

  await prisma.$disconnect();
}

configureEmail().catch(err => {
  console.error('❌ Error configuring email:', err);
  process.exit(1);
});
