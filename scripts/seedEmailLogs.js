import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedEmailLogs() {
  console.log('\n=== Seeding Email Logs for Demo ===\n');
  
  try {
    // Create various email log types for demo
    const emailLogs = [
      {
        recipient: 'ankit19787@gmail.com',
        subject: '✅ Your Post Has Been Published!',
        type: 'post_published',
        status: 'sent',
        messageId: '<test-1@brandpilot.com>',
        error: null
      },
      {
        recipient: 'ankit19787@gmail.com',
        subject: '❌ Post Publishing Failed',
        type: 'post_failed',
        status: 'sent',
        messageId: '<test-2@brandpilot.com>',
        error: null
      },
      {
        recipient: 'demo@example.com',
        subject: '💳 Payment Confirmed',
        type: 'payment_confirmed',
        status: 'failed',
        messageId: null,
        error: 'Email service not configured'
      },
      {
        recipient: 'ankit19787@gmail.com',
        subject: '⬆️ Plan Upgraded Successfully!',
        type: 'plan_upgraded',
        status: 'sent',
        messageId: '<test-4@brandpilot.com>',
        error: null
      },
      {
        recipient: 'ankit19787@gmail.com',
        subject: '⚠️ Credits Running Low',
        type: 'credits_low',
        status: 'sent',
        messageId: '<test-5@brandpilot.com>',
        error: null
      },
      {
        recipient: 'user@test.com',
        subject: '🧬 Your Brand DNA Has Been Generated!',
        type: 'brand_dna_generated',
        status: 'failed',
        messageId: null,
        error: 'SMTP connection timeout'
      },
    ];

    for (const log of emailLogs) {
      await prisma.emailLog.create({
        data: {
          ...log,
          metadata: JSON.stringify({ test: true })
        }
      });
    }

    console.log(`✅ Created ${emailLogs.length} sample email logs\n`);
    
    // Show summary
    const stats = await prisma.emailLog.groupBy({
      by: ['status'],
      _count: true
    });
    
    console.log('Statistics:');
    stats.forEach(s => {
      console.log(`  ${s.status}: ${s._count}`);
    });
    
    console.log('\nYou can now view the Email Logs tab in the admin panel!\n');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedEmailLogs();
