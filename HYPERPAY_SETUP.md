# HyperPay Payment Integration Setup

## Overview
This guide explains how to set up HyperPay payment integration for the BrandPilot OS plan upgrade system.

## Configuration Storage

HyperPay settings are stored in the **database Config table** (not .env files), following the same pattern as your other application configurations.

**Required Configuration Keys:**
- `HYPERPAY_ENTITY_ID` - Your HyperPay Entity ID from dashboard
- `HYPERPAY_ACCESS_TOKEN` - Your HyperPay Access Token
- `HYPERPAY_MODE` - Payment mode: `test` or `live`
- `HYPERPAY_BRANDS` - Supported payment brands: `VISA,MASTER,MADA`

## Setup Steps

### 1. Create HyperPay Account
1. Visit [HyperPay](https://www.hyperpay.com/) or contact their sales team
2. Sign up for a merchant account
3. Complete the KYC verification process
4. Get approved for payment processing

### 2. Get Test Credentials
1. Log in to [HyperPay Test Console](https://test.hyperpay.com/)
2. Navigate to Settings → Channels
3. Copy your **Entity ID** (e.g., `8ac7a4c882f47e760182f52f66f81234`)
4. Navigate to Settings → API Access
5. Generate or copy your **Access Token**

### 3. Configure in Database

**Using Configuration Script:**

```bash
# Initialize default configuration
node scripts/configureHyperPay.js

# Update with your actual credentials
node scripts/updateHyperPayConfig.js HYPERPAY_ENTITY_ID "8ac7a4c882f47e760182f52f66f81234"
node scripts/updateHyperPayConfig.js HYPERPAY_ACCESS_TOKEN "your_access_token_here"
node scripts/updateHyperPayConfig.js HYPERPAY_MODE "test"
node scripts/updateHyperPayConfig.js HYPERPAY_BRANDS "VISA,MASTER,MADA"
```

**Using API Endpoint:**

```bash
# Via POST /api/config endpoint
curl -X POST http://localhost:3001/api/config \
  -H "Content-Type: application/json" \
  -d '{"key": "HYPERPAY_ENTITY_ID", "value": "your_entity_id"}'
```

### 4. Test in Sandbox
1. Ensure `HYPERPAY_MODE` is set to `test` in database
2. Restart your server to load new config
3. Use HyperPay test cards:
- **VISA**: 4200000000000000
- **MASTERCARD**: 5454545454545454
- **CVV**: Any 3 digits
- **Expiry**: Any future date

### 5. Production Setup
1. Get production Entity ID and Access Token
2. Update database configuration:
   ```bash
   node scripts/updateHyperPayConfig.js HYPERPAY_ENTITY_ID "prod_entity_id"
   node scripts/updateHyperPayConfig.js HYPERPAY_ACCESS_TOKEN "prod_access_token"
   node scripts/updateHyperPayConfig.js HYPERPAY_MODE "live"
   ```
3. Configure webhook URL: `https://yourdomain.com/api/webhooks/hyperpay`
4. Restart server to apply changes

## Payment Flow

```
User clicks "Upgrade Now"
    ↓
Frontend calls initiatePayment()
    ↓
Backend creates HyperPay checkout
    ↓
Payment widget loads
    ↓
User enters card details
    ↓
HyperPay processes payment
    ↓
User redirected back
    ↓
Frontend calls verifyPayment()
    ↓
Plan upgraded if successful
```

## Testing Checklist

- [ ] Environment variables configured
- [ ] Payment widget loads correctly
- [ ] Test card payment completes
- [ ] Payment verification works
- [ ] User plan upgrades in database
- [ ] Credits reset correctly
- [ ] Webhook receives notifications

## Security Notes

- Never commit `.env` file to version control
- Use HTTPS in production
- Verify webhook signatures
- Monitor transactions

## Support

- Documentation: https://wordpresshyperpay.docs.oppwa.com/
- Support: Contact HyperPay merchant support

