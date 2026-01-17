import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class EmailService {
  constructor() {
    this.transporter = null;
    this.fromEmail = 'noreply@brandpilot.com';
    this.isConfigured = false;
    // Initialize on first use to allow async database loading
  }

  async initializeTransporter() {
    if (this.transporter) return; // Already initialized

    try {
      // Load email configuration from database
      const configs = await prisma.config.findMany({
        where: {
          key: {
            in: ['email_host', 'email_port', 'email_secure', 'email_user', 'email_pass', 'email_from']
          }
        }
      });

      const configMap = {};
      configs.forEach(c => configMap[c.key] = c.value);

      // Check required configuration
      if (!configMap.email_host || !configMap.email_user || !configMap.email_pass) {
        throw new Error('Email service not configured. Required: email_host, email_user, email_pass');
      }

      this.fromEmail = configMap.email_from || 'noreply@brandpilot.com';

      this.transporter = nodemailer.createTransport({
        host: configMap.email_host,
        port: parseInt(configMap.email_port || '587'),
        secure: configMap.email_secure === 'true', // true for 465, false for other ports
        auth: {
          user: configMap.email_user,
          pass: configMap.email_pass,
        },
      });

      this.isConfigured = true;
      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
    }
  }

  async sendEmail({ to, subject, html, text }) {
    // Initialize transporter on first use if not already done
    if (!this.transporter && !this.isConfigured) {
      await this.initializeTransporter();
    }

    if (!this.isConfigured) {
      console.log('📧 Email not sent (service not configured):', { to, subject });
      // Log failed attempt to database
      await this.logEmailAttempt({
        recipient: to,
        subject,
        type: this.extractEmailType(subject),
        status: 'failed',
        error: 'Email service not configured',
        metadata: null
      });
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"BrandPilot" <${this.fromEmail}>`,
        to,
        subject,
        text,
        html,
      });

      console.log('✅ Email sent:', info.messageId, 'to:', to);
      
      // Log successful send to database
      await this.logEmailAttempt({
        recipient: to,
        subject,
        type: this.extractEmailType(subject),
        status: 'sent',
        messageId: info.messageId,
        error: null,
        metadata: null
      });
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send email:', error.message);
      
      // Log failed attempt to database
      await this.logEmailAttempt({
        recipient: to,
        subject,
        type: this.extractEmailType(subject),
        status: 'failed',
        error: error.message,
        metadata: null
      });
      
      return { success: false, error: error.message };
    }
  }

  // Helper to extract email type from subject
  extractEmailType(subject) {
    if (subject.includes('Published')) return 'post_published';
    if (subject.includes('Failed')) return 'post_failed';
    if (subject.includes('Payment')) return 'payment_confirmed';
    if (subject.includes('Plan Upgraded')) return 'plan_upgraded';
    if (subject.includes('Credits') && subject.includes('Low')) return 'credits_low';
    if (subject.includes('Running Low')) return 'credits_low';
    if (subject.includes('Brand DNA')) return 'brand_dna_generated';
    return 'other';
  }

  // Log email attempt to database
  async logEmailAttempt({ recipient, subject, type, status, messageId, error, metadata }) {
    try {
      await prisma.emailLog.create({
        data: {
          recipient,
          subject,
          type,
          status,
          messageId,
          error,
          metadata: metadata ? JSON.stringify(metadata) : null
        }
      });
    } catch (dbError) {
      console.error('Failed to log email to database:', dbError.message);
      // Don't throw - email logging failure shouldn't break email sending
    }
  }

  // Post Published Successfully
  async sendPostPublishedEmail(userEmail, username, postDetails) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .footer { text-align: center; color: #666; padding: 20px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Post Published Successfully!</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${username}</strong>,</p>
            <p>Great news! Your content has been successfully published.</p>
            
            <div class="details">
              <p><span class="success-badge">PUBLISHED</span></p>
              <p><strong>Platform:</strong> ${postDetails.platform}</p>
              <p><strong>Content:</strong> ${postDetails.content.substring(0, 100)}${postDetails.content.length > 100 ? '...' : ''}</p>
              ${postDetails.platformPostId ? `<p><strong>Post ID:</strong> ${postDetails.platformPostId}</p>` : ''}
            </div>
            
            <p>Your audience can now engage with your content! 🚀</p>
          </div>
          <div class="footer">
            <p>BrandPilot - Your AI-Powered Content Partner</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: '✅ Your Post Has Been Published!',
      html,
      text: `Hi ${username}, your post to ${postDetails.platform} has been published successfully!`,
    });
  }

  // Post Publishing Failed
  async sendPostFailedEmail(userEmail, username, postDetails, error) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .error-badge { background: #dc2626; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
          .footer { text-align: center; color: #666; padding: 20px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Post Publishing Failed</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${username}</strong>,</p>
            <p>We encountered an issue while trying to publish your content.</p>
            
            <div class="details">
              <p><span class="error-badge">FAILED</span></p>
              <p><strong>Platform:</strong> ${postDetails.platform}</p>
              <p><strong>Error:</strong> ${error}</p>
              <p><strong>Scheduled Time:</strong> ${postDetails.scheduledFor}</p>
            </div>
            
            <p>Don't worry - you can retry publishing from your Content Calendar. If the issue persists, please check your platform connections.</p>
          </div>
          <div class="footer">
            <p>BrandPilot - Your AI-Powered Content Partner</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: '⚠️ Post Publishing Failed',
      html,
      text: `Hi ${username}, failed to publish to ${postDetails.platform}. Error: ${error}`,
    });
  }

  // Payment Confirmed
  async sendPaymentConfirmedEmail(userEmail, username, paymentDetails) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .amount { font-size: 32px; font-weight: bold; color: #10b981; text-align: center; margin: 20px 0; }
          .footer { text-align: center; color: #666; padding: 20px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💳 Payment Confirmed!</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${username}</strong>,</p>
            <p>Thank you! Your payment has been successfully processed.</p>
            
            <div class="amount">${paymentDetails.amount} ${paymentDetails.currency}</div>
            
            <div class="details">
              <p><strong>Plan:</strong> ${paymentDetails.plan.toUpperCase()}</p>
              <p><strong>Billing Cycle:</strong> ${paymentDetails.billingCycle}</p>
              <p><strong>Credits Allocated:</strong> ${paymentDetails.credits.toLocaleString()}</p>
              <p><strong>Transaction ID:</strong> ${paymentDetails.checkoutId}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <p>Your account has been upgraded and credits are now available. Start creating amazing content! 🎨</p>
          </div>
          <div class="footer">
            <p>BrandPilot - Your AI-Powered Content Partner</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: '✅ Payment Confirmed - Welcome to ' + paymentDetails.plan.toUpperCase(),
      html,
      text: `Hi ${username}, your payment of ${paymentDetails.amount} ${paymentDetails.currency} has been confirmed. Welcome to ${paymentDetails.plan}!`,
    });
  }

  // Payment Failed
  async sendPaymentFailedEmail(userEmail, username, paymentDetails, error) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
          .footer { text-align: center; color: #666; padding: 20px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Payment Failed</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${username}</strong>,</p>
            <p>We were unable to process your payment.</p>
            
            <div class="details">
              <p><strong>Plan:</strong> ${paymentDetails.plan.toUpperCase()}</p>
              <p><strong>Amount:</strong> ${paymentDetails.amount} ${paymentDetails.currency}</p>
              <p><strong>Reason:</strong> ${error}</p>
            </div>
            
            <p>Please try again or contact support if you need assistance.</p>
          </div>
          <div class="footer">
            <p>BrandPilot - Your AI-Powered Content Partner</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: '❌ Payment Failed',
      html,
      text: `Hi ${username}, your payment of ${paymentDetails.amount} ${paymentDetails.currency} failed. Reason: ${error}`,
    });
  }

  // Plan Upgraded
  async sendPlanUpgradedEmail(userEmail, username, planDetails) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .plan-badge { background: #8b5cf6; color: white; padding: 12px 24px; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 18px; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; color: #666; padding: 20px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 Plan Upgraded!</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${username}</strong>,</p>
            <p>Congratulations! Your plan has been upgraded.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <span class="plan-badge">${planDetails.newPlan.toUpperCase()}</span>
            </div>
            
            <div class="details">
              <p><strong>Previous Plan:</strong> ${planDetails.oldPlan || 'Free'}</p>
              <p><strong>New Plan:</strong> ${planDetails.newPlan.toUpperCase()}</p>
              <p><strong>Credits:</strong> ${planDetails.credits.toLocaleString()}</p>
              <p><strong>Max Credits:</strong> ${planDetails.maxCredits.toLocaleString()}</p>
            </div>
            
            <p>You now have access to more features and higher limits. Time to take your content strategy to the next level! 🎯</p>
          </div>
          <div class="footer">
            <p>BrandPilot - Your AI-Powered Content Partner</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: '🚀 Welcome to ' + planDetails.newPlan.toUpperCase(),
      html,
      text: `Hi ${username}, your plan has been upgraded to ${planDetails.newPlan}! You now have ${planDetails.credits} credits.`,
    });
  }

  // Credits Low Warning
  async sendCreditsLowEmail(userEmail, username, creditDetails) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .warning-badge { background: #f59e0b; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
          .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; }
          .footer { text-align: center; color: #666; padding: 20px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Credits Running Low</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${username}</strong>,</p>
            <p>Your credits are running low. Consider upgrading your plan to continue creating amazing content.</p>
            
            <div class="details">
              <p><strong>Current Credits:</strong> ${creditDetails.currentCredits}</p>
              <p><strong>Max Credits:</strong> ${creditDetails.maxCredits}</p>
              <p><strong>Usage:</strong> ${Math.round((creditDetails.currentCredits / creditDetails.maxCredits) * 100)}%</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">Upgrade Plan</a>
            </div>
          </div>
          <div class="footer">
            <p>BrandPilot - Your AI-Powered Content Partner</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: '⚠️ Credits Running Low',
      html,
      text: `Hi ${username}, you have ${creditDetails.currentCredits} credits remaining. Consider upgrading to continue.`,
    });
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(userEmail, username, password, userPlan = 'free') {
    if (!userEmail) {
      console.log('⏭️  Skipping welcome email - no email provided');
      return { success: false, reason: 'No email provided' };
    }

    await this.initializeTransporter();
    
    if (!this.isConfigured) {
      console.log('⏭️  Skipping welcome email - email service not configured');
      return { success: false, reason: 'Email service not configured' };
    }

    const planFeatures = {
      free: ['1,000 credits per month', 'Basic AI content generation', 'Single platform posting'],
      pro: ['10,000 credits per month', 'Advanced AI features', 'Multi-platform posting', 'Brand DNA analysis'],
      business: ['50,000 credits per month', 'Priority support', 'Team collaboration', 'Advanced analytics'],
      enterprise: ['100,000 credits per month', 'Custom integrations', 'Dedicated support', 'White-label options']
    };

    const features = planFeatures[userPlan] || planFeatures.free;
    const planName = userPlan.charAt(0).toUpperCase() + userPlan.slice(1);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .email-container { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .credentials-box { background: #fff; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .feature-list { list-style: none; padding: 0; }
          .feature-list li { padding: 8px 0; border-bottom: 1px solid #eee; }
          .feature-list li:before { content: "✅"; margin-right: 10px; }
          .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>🚀 Welcome to BrandPilot!</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${username}</strong>,</p>
            <p>Your BrandPilot account has been created and you're ready to revolutionize your social media content! 🎉</p>
            
            <div class="credentials-box">
              <h3>🔐 Your Login Credentials</h3>
              <p><strong>Username:</strong> ${username}</p>
              <p><strong>Password:</strong> ${password}</p>
              <p><em>Please save these credentials in a secure location and consider changing your password after your first login.</em></p>
            </div>

            <h3>📦 Your ${planName} Plan Includes:</h3>
            <ul class="feature-list">
              ${features.map(feature => `<li>${feature}</li>`).join('')}
            </ul>

            <p>Get started by:</p>
            <ol>
              <li>🔑 Log in to your account</li>
              <li>🎨 Create your Brand DNA profile</li>
              <li>📱 Connect your social media platforms</li>
              <li>✨ Start generating amazing content!</li>
            </ol>

            <p>Need help? Our documentation and support team are here to assist you every step of the way.</p>
            
            <p>Welcome to the future of social media content creation! 🌟</p>
          </div>
          <div class="footer">
            <p>BrandPilot - Your AI-Powered Content Partner</p>
            <p>This email was sent because an account was created for you by an administrator.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: '🚀 Welcome to BrandPilot - Your Account is Ready!',
      html,
      text: `Hi ${username}, welcome to BrandPilot! Your account has been created. Username: ${username}, Password: ${password}. Please log in and consider changing your password.`,
    });
  }

  // Brand DNA Generated
  async sendBrandDNAGeneratedEmail(userEmail, username) {
    const html = `
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
            <h1>🧬 Brand DNA Generated!</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${username}</strong>,</p>
            <p>Your Brand DNA analysis is complete! We've analyzed your content and created a comprehensive brand profile.</p>
            <p>This will help generate more consistent, on-brand content that resonates with your audience.</p>
            <p>Log in to view your Brand DNA and start creating content that truly reflects your unique voice! 🎨</p>
          </div>
          <div class="footer">
            <p>BrandPilot - Your AI-Powered Content Partner</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: '🧬 Your Brand DNA is Ready!',
      html,
      text: `Hi ${username}, your Brand DNA analysis is complete! Log in to view your brand profile.`,
    });
  }
}

// Export singleton instance
const emailService = new EmailService();
export default emailService;
