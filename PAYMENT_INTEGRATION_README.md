# HyperPay Payment Integration - Quick Start

## What's Been Implemented

The HyperPay payment integration has been added to enable real payment processing for plan upgrades. Here's what's included:

### 1. **Payment Service** ([hyperPayService.ts](services/hyperPayService.ts))
- Creates HyperPay checkout sessions
- Verifies payment status
- Handles payment result codes
- Supports VISA, Mastercard, and MADA

### 2. **Server Endpoints** ([server.js](server.js))
- `POST /api/payment/checkout` - Creates payment checkout
- `GET /api/payment/verify/:checkoutId` - Verifies payment status
- `POST /api/webhooks/hyperpay` - Handles async payment notifications

### 3. **UI Integration** ([PlanModal.tsx](components/PlanModal.tsx))
- Payment widget embedded in plan modal
- Loading states and error handling
- Automatic payment verification
- User feedback for payment status

## How to Set Up

### Step 1: Get HyperPay Credentials

1. Sign up for a HyperPay merchant account at https://www.hyperpay.com/
2. Log in to the test dashboard: https://test.hyperpay.com/
3. Get your **Entity ID** from Settings → Channels
4. Get your **Access Token** from Settings → API Access

### Step 2: Configure Payment Settings in Database

HyperPay settings are stored in the database Config table (same pattern as your other configurations).

**Option A: Using the configuration script**

Run the setup script to initialize HyperPay settings:

```bash
node scripts/configureHyperPay.js
```

This creates the default configuration entries. Then update them with your actual credentials:

```bash
# Update Entity ID
node scripts/updateHyperPayConfig.js HYPERPAY_ENTITY_ID "8ac7a4c882f47e760182f52f66f81234"

# Update Access Token
node scripts/updateHyperPayConfig.js HYPERPAY_ACCESS_TOKEN "your_access_token_here"

# Update Mode (test or live)
node scripts/updateHyperPayConfig.js HYPERPAY_MODE "test"

# Update Payment Brands
node scripts/updateHyperPayConfig.js HYPERPAY_BRANDS "VISA,MASTER,MADA"
```

**Option B: Using the API endpoint**

You can also configure via API (same as other configs):

```bash
# Set Entity ID
curl -X POST http://localhost:3001/api/config \
  -H "Content-Type: application/json" \
  -d '{"key": "HYPERPAY_ENTITY_ID", "value": "your_entity_id"}'

# Set Access Token
curl -X POST http://localhost:3001/api/config \
  -H "Content-Type: application/json" \
  -d '{"key": "HYPERPAY_ACCESS_TOKEN", "value": "your_access_token"}'

# Set Mode
curl -X POST http://localhost:3001/api/config \
  -H "Content-Type: application/json" \
  -d '{"key": "HYPERPAY_MODE", "value": "test"}'

# Set Brands
curl -X POST http://localhost:3001/api/config \
  -H "Content-Type: application/json" \
  -d '{"key": "HYPERPAY_BRANDS", "value": "VISA,MASTER,MADA"}'
```

### Step 3: Verify Configuration

Check that your settings are saved:

```bash
# View all configs (optional - shows all config entries)
curl http://localhost:3001/api/config
```

### Step 4: Restart the Server

```bash
# Kill any running servers
taskkill /F /IM node.exe

# Start the server
npm run dev
```

## How It Works

### Payment Flow

1. **User clicks "Upgrade Now"** on a paid plan (Pro or Business)
2. **Frontend creates checkout**:
   - Calls `initiatePayment(plan, billingCycle, userEmail)`
   - Server creates HyperPay checkout session
   - Returns `checkoutId` and payment widget URL
3. **Payment widget loads**:
   - HyperPay widget script injected into page
   - User sees payment form in the modal
4. **User enters card details** and submits
5. **HyperPay processes payment**:
   - 3D Secure authentication if required
   - Redirects back to app with result
6. **Frontend verifies payment**:
   - Calls `verifyPayment(checkoutId)`
   - Server checks payment status with HyperPay
7. **Plan upgraded**:
   - If successful, user plan updated in database
   - Credits reset to new plan limits
   - Subscription record created
8. **Webhook confirmation** (async):
   - HyperPay sends webhook to `/api/webhooks/hyperpay`
   - Server processes and confirms payment

### Testing with Test Cards

Use these HyperPay test cards in sandbox mode:

- **VISA**: `4200000000000000`
- **Mastercard**: `5454545454545454`
- **CVV**: Any 3 digits (e.g., `123`)
- **Expiry**: Any future date (e.g., `12/25`)
- **Name**: Any name

## What Happens During Payment

1. **Plan Modal shows payment widget** with HyperPay form
2. **User enters card details**:
   - Card number, expiry, CVV, cardholder name
3. **3D Secure** (if enabled):
   - Bank authentication popup
   - User enters OTP or password
4. **Processing**:
   - Loading indicator shown
   - "Verifying payment..." message
5. **Success**:
   - "Payment successful! Welcome to [PLAN] plan!" message
   - Modal closes after 2 seconds
   - Credits updated in UI
   - Sidebar shows new plan features
6. **Failure**:
   - "Payment failed. Please try again." message
   - User can retry or cancel

## Pricing Configuration

Prices are defined in [hyperPayService.ts](services/hyperPayService.ts):

```typescript
export const PLAN_PRICING = {
  pro: {
    monthly: 29,
    yearly: 24 * 12,  // $288/year ($24/month)
    currency: 'USD'
  },
  business: {
    monthly: 79,
    yearly: 65 * 12,  // $780/year ($65/month)
    currency: 'USD'
  }
};
```

To change pricing:
1. Update `PLAN_PRICING` in [hyperPayService.ts](services/hyperPayService.ts)
2. Update prices displayed in [PlanModal.tsx](components/PlanModal.tsx)

## Database Changes

When payment succeeds:

1. **User table updated**:
   ```sql
   UPDATE User SET 
     plan = 'pro',
     credits = 10000,
     maxCredits = 10000,
     creditsResetAt = NOW()
   WHERE id = 'user_id'
   ```

2. **Subscription record created**:
   ```sql
   INSERT INTO Subscription (
     userId, plan, status, 
     stripeCustomerId,  -- Stores HyperPay checkout ID
     stripeSubscriptionId,  -- Stores HyperPay payment ID
     currentPeriodStart, currentPeriodEnd
   ) VALUES (...)
   ```

3. **Credit transaction logged**:
   ```sql
   INSERT INTO CreditTransaction (
     userId, amount, action, description,
     balanceBefore, balanceAfter
   ) VALUES (
     'user_id', 10000, 'plan_upgrade',
     'Upgraded to pro plan via HyperPay', 0, 10000
   )
   ```

## Monitoring Payments

### View Payment Logs

Server logs show detailed payment information:

```
Creating HyperPay checkout: { plan: 'pro', billingCycle: 'monthly', amount: 29 }
HyperPay checkout created: 8ac7a4a18...
Verifying payment: 8ac7a4a18...
Payment status: { checkoutId: '8ac7a4a18...', code: '000.000.000', isSuccessful: true }
Plan upgraded successfully: { userId: 'user_id', plan: 'pro' }
```

### Check Database

Use the verification script:

```bash
node scripts/checkUserPlan.js
```

Output shows:
- All users with their current plans
- Active subscriptions
- Recent credit transactions

## Troubleshooting

### Payment Widget Not Loading

**Problem**: Widget doesn't appear after clicking "Upgrade Now"

**Solutions**:
- Check browser console for errors
- Verify HyperPay credentials in `.env`
- Ensure Entity ID and Access Token are correct
- Check server logs for checkout creation errors

### Payment Fails with Error

**Problem**: Payment shows "Failed" status

**Solutions**:
- Check HyperPay dashboard for transaction details
- Verify test card numbers are correct
- Ensure payment brands (VISA, MASTER) are enabled in HyperPay
- Check result code in server logs

### Plan Not Upgrading After Payment

**Problem**: Payment succeeds but plan stays the same

**Solutions**:
- Check server logs for verification errors
- Run `node scripts/checkUserPlan.js` to see database state
- Verify webhook URL is accessible (for production)
- Check Subscription table for pending records

### Webhook Not Working

**Problem**: Webhook not receiving notifications

**Solutions**:
- In production, ensure webhook URL is publicly accessible
- Configure webhook URL in HyperPay dashboard: Settings → Webhooks
- Check webhook signature verification (to be implemented)
- Monitor server logs for incoming webhook requests

## Production Deployment

### Before Going Live

- [ ] Get production HyperPay credentials
- [ ] Update `.env` with production Entity ID and Access Token
- [ ] Set `HYPERPAY_MODE=live`
- [ ] Configure production webhook URL in HyperPay dashboard
- [ ] Test with small real amounts
- [ ] Set up error monitoring (Sentry, LogRocket)
- [ ] Configure SSL certificate
- [ ] Review and update pricing
- [ ] Update Terms of Service with payment terms
- [ ] Set up customer support for payment issues

### Production Environment Variables

```env
HYPERPAY_ENTITY_ID=your_production_entity_id
HYPERPAY_ACCESS_TOKEN=your_production_access_token
HYPERPAY_MODE=live
HYPERPAY_BRANDS=VISA,MASTER,MADA
```

## Next Steps

1. **Get HyperPay account** and test credentials
2. **Configure in database** using scripts or API
3. **Restart server** to load configuration
4. **Test payment flow** with test cards
5. **Monitor logs** to ensure everything works
6. **Plan production deployment** when ready

## Configuration Management

### View Current Configuration

```bash
# Using script
node scripts/configureHyperPay.js

# Using API
curl http://localhost:3001/api/config
```

### Update Individual Settings

```bash
# Update mode to production
node scripts/updateHyperPayConfig.js HYPERPAY_MODE "live"

# Update supported brands
node scripts/updateHyperPayConfig.js HYPERPAY_BRANDS "VISA,MASTER,MADA,AMEX"
```

## Support

- **HyperPay Docs**: https://wordpresshyperpay.docs.oppwa.com/
- **HyperPay Support**: support@hyperpay.com
- **Test Dashboard**: https://test.hyperpay.com/
- **Production Dashboard**: https://oppwa.com/

## Files Modified

1. **services/hyperPayService.ts** - Payment service with HyperPay API integration
2. **server.js** - Added payment endpoints and webhook handler
3. **components/PlanModal.tsx** - Integrated payment widget UI
4. **.env.example** - Added HyperPay environment variables
5. **HYPERPAY_SETUP.md** - Detailed setup guide

## Questions?

For setup help or issues, check:
- Server logs for payment errors
- Browser console for frontend issues
- HyperPay dashboard for transaction status
- Database using `scripts/checkUserPlan.js`
