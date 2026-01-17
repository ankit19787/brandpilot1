# Email Logging System

## Overview
The email logging system tracks all email delivery attempts (successful and failed) in the database and provides an admin panel to monitor email performance.

## Features

### 1. Database Storage
- **EmailLog Model**: Stores every email attempt with:
  - Recipient email address
  - Email subject and type
  - Status (sent/failed)
  - Message ID (if successful)
  - Error message (if failed)
  - Timestamp

### 2. Automatic Logging
All email attempts are automatically logged, including:
- ✅ Post Published notifications
- ❌ Post Failed notifications
- 💳 Payment Confirmed
- ❌ Payment Failed
- ⬆️ Plan Upgraded
- ⚠️ Credits Low
- 🧬 Brand DNA Generated

### 3. Admin Panel
Access via **Sidebar → Email Logs** (requires Business plan or higher)

**Statistics Dashboard:**
- Total emails sent
- Total emails failed
- Success rate percentage
- Total email count

**Filtering Options:**
- Filter by status (sent/failed)
- Filter by email type

**Logs Table:**
- Status badge (sent/failed)
- Email type with color coding
- Recipient address
- Subject line
- Timestamp
- Message ID or error details

## API Endpoint

### GET `/api/email-logs`

**Query Parameters:**
- `limit` - Number of logs to return (default: 50)
- `status` - Filter by status: 'sent' | 'failed'
- `type` - Filter by type: 'post_published' | 'post_failed' | etc.

**Response:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "recipient": "user@example.com",
      "subject": "Email subject",
      "type": "post_published",
      "status": "sent",
      "messageId": "<message-id@brandpilot.com>",
      "error": null,
      "createdAt": "2026-01-17T09:34:03.760Z"
    }
  ],
  "stats": {
    "totalSent": 5,
    "totalFailed": 2,
    "total": 7,
    "successRate": "71.43"
  }
}
```

## Email Types

| Type | Description | Subject Pattern |
|------|-------------|----------------|
| `post_published` | Post successfully published | "Published" |
| `post_failed` | Post publishing failed | "Failed" |
| `payment_confirmed` | Payment processed successfully | "Payment" |
| `payment_failed` | Payment processing failed | "Payment" |
| `plan_upgraded` | User plan upgraded | "Plan Upgraded" |
| `credits_low` | User credits below 20% | "Credits Low" |
| `brand_dna_generated` | Brand DNA created | "Brand DNA" |
| `other` | Other email types | - |

## Database Schema

```prisma
model EmailLog {
  id          String   @id @default(uuid())
  recipient   String
  subject     String
  type        String
  status      String   // 'sent' | 'failed'
  messageId   String?
  error       String?
  metadata    String?  // JSON
  createdAt   DateTime @default(now())
  
  @@index([status])
  @@index([type])
  @@index([createdAt])
  @@index([recipient])
}
```

## Usage Examples

### View Email Logs
1. Login as admin
2. Navigate to **Email Logs** in sidebar
3. View statistics and recent emails
4. Filter by status or type as needed

### Check Email Delivery
```bash
# Check recent email logs
curl http://localhost:3001/api/email-logs

# Filter by failed emails only
curl http://localhost:3001/api/email-logs?status=failed

# Filter by type
curl http://localhost:3001/api/email-logs?type=post_published
```

### Seed Test Data
```bash
node scripts/seedEmailLogs.js
```

## Monitoring Tips

1. **Success Rate**: Should be >95% for healthy email service
2. **Failed Emails**: Check error messages for:
   - SMTP configuration issues
   - Network connectivity problems
   - Invalid recipient addresses
3. **Recent Activity**: Monitor post-related emails to ensure notifications are working

## Troubleshooting

If emails are failing:

1. Check Email Configuration:
   ```bash
   node scripts/checkEmailConfig.js
   ```

2. View Failed Email Errors:
   - Go to Email Logs tab
   - Filter by "Failed" status
   - Check error column for details

3. Test Email Service:
   ```bash
   node scripts/testEmail.js
   ```

4. Verify SMTP Settings in Credentials page

## Related Files

- Database Model: `prisma/schema.prisma`
- Email Service: `services/emailService.js`
- Admin Component: `components/EmailLogs.tsx`
- API Endpoint: `server.js` (line ~1138)
- Test Scripts: `scripts/seedEmailLogs.js`, `scripts/testDirectPostEmail.js`
