# Email Notification System

BrandPilot includes a comprehensive email notification system that keeps users informed about important events.

## Features

The email service sends beautifully designed HTML emails for:

- ✅ **Post Published** - Confirms when content goes live on social platforms
- ⚠️ **Post Failed** - Alerts about publishing failures with error details
- 💳 **Payment Confirmed** - Receipt for successful payments
- ❌ **Payment Failed** - Notification of failed payment attempts
- 🚀 **Plan Upgraded** - Celebrates plan upgrades with new features
- ⚠️ **Credits Low** - Warning when credits drop below 20%
- 🧬 **Brand DNA Generated** - Confirms completion of brand analysis

## Setup

### 1. Configure Email Settings

Run the configuration script with your SMTP details:

```bash
node scripts/configureEmail.js <HOST> <PORT> <SECURE> <USER> <PASS> [FROM]
```

### Examples

**Gmail (Recommended for testing):**
```bash
node scripts/configureEmail.js smtp.gmail.com 587 false your-email@gmail.com your-app-password
```

**Office 365:**
```bash
node scripts/configureEmail.js smtp.office365.com 587 false your-email@company.com your-password
```

**Custom SMTP with SSL:**
```bash
node scripts/configureEmail.js mail.example.com 465 true user@example.com password noreply@example.com
```

### 2. Gmail App Password Setup

If using Gmail:

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification (if not already enabled)
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Generate a new app password for "Mail"
5. Use this 16-character password in the configuration

### 3. Test Email Service

```bash
node scripts/testEmail.js
```

This will:
- Display current email configuration
- Find a user with an email address
- Send a test email to verify everything works

## Configuration Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| HOST | SMTP server hostname | smtp.gmail.com |
| PORT | SMTP port (587 for TLS, 465 for SSL) | 587 |
| SECURE | Use SSL (true/false) | false |
| USER | Email account username | your-email@gmail.com |
| PASS | Email password or app password | abcd efgh ijkl mnop |
| FROM | From email address (optional) | noreply@brandpilot.com |

## User Email Setup

Users need to add their email address in **Profile Settings** to receive notifications:

1. Login to BrandPilot
2. Go to Profile Settings
3. Add email address
4. Save profile

## Email Templates

All emails include:
- Professional HTML design with BrandPilot branding
- Clear, actionable information
- Responsive layout
- Plain text fallback

## Troubleshooting

### Emails not sending?

1. **Check configuration:**
   ```bash
   node scripts/testEmail.js
   ```

2. **Verify SMTP credentials:**
   - Ensure username/password are correct
   - For Gmail, use App Password, not regular password
   - Check if 2FA is enabled

3. **Check server logs:**
   - Look for "Email service initialized successfully" on server start
   - Check for any error messages

4. **Test connection:**
   - Verify SMTP host is reachable
   - Check firewall/network settings
   - Ensure port is not blocked

### Common Issues

**"Email service not configured"**
- Run `node scripts/configureEmail.js` with your SMTP details

**"Invalid login" (Gmail)**
- Use App Password, not account password
- Enable 2-Step Verification first

**"Connection timeout"**
- Check if port 587/465 is blocked
- Try different port (587 vs 465)
- Check if behind corporate firewall

## Database Storage

Email configuration is stored in the `Config` table:

```sql
SELECT * FROM "Config" WHERE key LIKE 'EMAIL_%';
```

Keys:
- `EMAIL_HOST` - SMTP server
- `EMAIL_PORT` - SMTP port
- `EMAIL_SECURE` - SSL enabled (true/false)
- `EMAIL_USER` - Account username
- `EMAIL_PASS` - Account password (encrypted in production)
- `EMAIL_FROM` - From address

## Security Notes

- Email passwords are stored in the database - ensure database security
- Use App Passwords instead of main account passwords
- Consider encryption for production deployments
- Regularly rotate email passwords
- Monitor email sending for abuse

## Development vs Production

**Development:**
- Use Gmail with App Password
- Test with your own email address
- Monitor console for email logs

**Production:**
- Use dedicated SMTP service (SendGrid, AWS SES, etc.)
- Implement rate limiting
- Add email queue for reliability
- Monitor delivery rates
- Set up SPF/DKIM/DMARC records

## API Integration

The email service is automatically integrated with:

- `POST /api/brand-dna` - Sends Brand DNA email
- `PATCH /api/posts/:postId` - Sends post published/failed emails
- `GET /api/payment/verify/:checkoutId` - Sends payment emails
- `POST /api/user/credits/deduct` - Sends low credits warning

No additional configuration needed - emails send automatically when events occur!
