import emailService from '../services/emailService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testEmail() {
  console.log('📧 Testing Email Service...\n');

  try {
    // Get email configuration
    const configs = await prisma.config.findMany({
      where: {
        key: { in: ['email_host', 'email_port', 'email_user', 'email_from'] }
      }
    });

    console.log('Current Email Configuration:');
    configs.forEach(c => {
      console.log(`  ${c.key}: ${c.value}`);
    });
    console.log();

    // Get test user email
    const testUser = await prisma.user.findFirst({
      where: { email: { not: null } }
    });

    if (!testUser || !testUser.email) {
      console.log('⚠️  No user with email found. Please add an email to a user first.');
      console.log('   You can update a user email using the Profile Settings in the app.\n');
      await prisma.$disconnect();
      return;
    }

    console.log(`Sending test email to: ${testUser.email}\n`);

    // Send test email
    const result = await emailService.sendEmail({
      to: testUser.email,
      subject: '🎉 BrandPilot Email Test',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .footer { text-align: center; color: #666; padding: 20px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Email Service is Working!</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${testUser.username}</strong>,</p>
              <p>Great news! Your BrandPilot email service is properly configured and working.</p>
              <p>You'll now receive notifications for:</p>
              <ul>
                <li>✅ Posts published successfully</li>
                <li>⚠️ Post publishing failures</li>
                <li>💳 Payment confirmations</li>
                <li>🚀 Plan upgrades</li>
                <li>⚠️ Low credits warnings</li>
                <li>🧬 Brand DNA generation</li>
              </ul>
              <p>This is a test email. No action required! 🎨</p>
            </div>
            <div class="footer">
              <p>BrandPilot - Your AI-Powered Content Partner</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hi ${testUser.username}, your BrandPilot email service is working! You'll receive notifications for posts, payments, and more.`
    });

    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log(`   Message ID: ${result.messageId}\n`);
    } else {
      console.log('❌ Failed to send test email');
      console.log(`   Error: ${result.error || result.message}\n`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testEmail();
