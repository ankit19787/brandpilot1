# HyperPay Configuration - Database Setup

## ✅ Implementation Complete

HyperPay payment configuration is now stored in the **database Config table** instead of .env files, following your existing application pattern.

## Quick Setup

### 1. Initialize Configuration

Run this script to create the default configuration entries:

```bash
node scripts/configureHyperPay.js
```

This will create 4 config entries in your database:
- `HYPERPAY_ENTITY_ID` (default: "your_entity_id_here")
- `HYPERPAY_ACCESS_TOKEN` (default: "your_access_token_here")  
- `HYPERPAY_MODE` (default: "test")
- `HYPERPAY_BRANDS` (default: "VISA,MASTER,MADA")

### 2. Update with Your HyperPay Credentials

Once you have your HyperPay account credentials, update them:

```bash
# Update Entity ID
node scripts/updateHyperPayConfig.js HYPERPAY_ENTITY_ID "8ac7a4c882f47e760182f52f66f81234"

# Update Access Token
node scripts/updateHyperPayConfig.js HYPERPAY_ACCESS_TOKEN "OGFjN2E0Yzg4MmY0N2U3NjAxODJmNTJmNjZmODEyMzR8OGFjN2E0Yzg4MmY0N2U3NjAxODJmNTJmNjZmODEyMzQ"

# Mode is already set to "test" - change to "live" for production:
# node scripts/updateHyperPayConfig.js HYPERPAY_MODE "live"
```

### 3. Alternative: Use API Endpoint

You can also configure via the existing `/api/config` endpoint:

```bash
curl -X POST http://localhost:3001/api/config \
  -H "Content-Type: application/json" \
  -d '{"key": "HYPERPAY_ENTITY_ID", "value": "your_entity_id"}'
```

Or from your frontend admin panel (if you have a config management UI).

### 4. Restart Server

The server loads HyperPay configuration from database on startup:

```bash
npm run dev:all
```

## How It Works

### Configuration Loading

When the server starts or a payment request is made:

1. Server queries the Config table for HyperPay settings
2. Creates HyperPayService instance with database values
3. Caches the service instance for subsequent requests
4. If config is missing/invalid, payment endpoints return error

### Code Flow

```javascript
// Server automatically loads from database
async function getHyperPayService() {
  const configs = await prisma.config.findMany({
    where: { key: { in: ['HYPERPAY_ENTITY_ID', ...] } }
  });
  // Creates service with database values
  return new HyperPayService(configMap);
}

// Payment endpoints use it
app.post('/api/payment/checkout', async (req, res) => {
  const service = await getHyperPayService();
  if (!service) {
    return res.status(503).json({ 
      error: 'Payment service not configured' 
    });
  }
  // Use service for payment
});
```

### Error Handling

If HyperPay is not configured, payment endpoints will return:

```json
{
  "error": "Payment service not configured. Please configure HyperPay settings."
}
```

This ensures the app doesn't crash if credentials aren't set up yet.

## Configuration Files

### New Scripts

1. **scripts/configureHyperPay.js**
   - Initializes default HyperPay configuration
   - Shows current configuration values
   - Usage: `node scripts/configureHyperPay.js`

2. **scripts/updateHyperPayConfig.js**
   - Updates individual configuration values
   - Usage: `node scripts/updateHyperPayConfig.js <KEY> <VALUE>`

### Modified Files

1. **server.js**
   - Removed hardcoded env config
   - Added `getHyperPayService()` function
   - Loads config from database dynamically
   - All payment endpoints check if service is configured

2. **Documentation**
   - PAYMENT_INTEGRATION_README.md - Updated for database config
   - HYPERPAY_SETUP.md - Updated setup instructions

## Testing Before HyperPay Setup

You can test the rest of your application without HyperPay credentials. The payment features will simply show an error message when users try to upgrade:

"Payment service not configured. Please configure HyperPay settings."

Once you add the credentials, payment will work immediately (no code changes needed).

## Production Deployment

When moving to production:

```bash
# Update to production credentials
node scripts/updateHyperPayConfig.js HYPERPAY_ENTITY_ID "prod_entity_id"
node scripts/updateHyperPayConfig.js HYPERPAY_ACCESS_TOKEN "prod_token"
node scripts/updateHyperPayConfig.js HYPERPAY_MODE "live"

# Restart server
pm2 restart brandpilot-os
```

## Viewing Current Configuration

```bash
# Shows all HyperPay settings (Access Token is partially hidden)
node scripts/configureHyperPay.js

# Or query the database directly
node scripts/checkUserPlan.js
```

## Benefits of Database Storage

✅ **Consistent with your app** - Same pattern as other configs  
✅ **No .env file needed** - One less file to manage  
✅ **Hot reload** - Can update config without redeploying  
✅ **Multiple environments** - Different configs per database  
✅ **Admin UI ready** - Can build config management in admin panel  
✅ **Audit trail** - Can track config changes in database  

## Next Steps

1. Get HyperPay account: https://www.hyperpay.com/
2. Run `node scripts/configureHyperPay.js` to initialize
3. Update credentials using `updateHyperPayConfig.js`
4. Test payment flow with test cards
5. Monitor server logs for payment events

That's it! Your payment system is now fully database-driven. 🎉
