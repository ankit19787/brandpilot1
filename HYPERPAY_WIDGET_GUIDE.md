# HyperPay Payment Widget Integration Guide

## Issue Identified
Users were not seeing the HyperPay payment form (card input fields) after clicking "Upgrade Now". 

## Root Cause
The payment widget form was being created but not properly initialized. The HyperPay script needs to find a form element with specific attributes to inject the payment fields.

## Solution Implemented

### 1. Fixed Form Initialization
- Added proper form element with `className="paymentWidgets"`
- Added `data-brands` attribute dynamically from server response
- Ensured form has an `action` attribute pointing to the return URL

### 2. Improved Script Loading
- Added error handling for script load failures
- Implemented proper cleanup of existing scripts before loading new one
- Added loading states and user feedback

### 3. Dynamic Brand Configuration
- Payment brands (VISA, MASTER, MADA) are now loaded from server configuration
- Brands are properly set in the form's `data-brands` attribute

## Testing the Integration

### Option 1: Use Test Page (Recommended)

1. Make sure your server is running:
   ```bash
   cd c:\cloud\brandpilot-os
   npm run dev
   ```

2. Open the test page in your browser:
   ```
   http://localhost:5173/test-hyperpay.html
   ```

3. Click "Create Test Checkout" button

4. You should see the payment form with:
   - Card number input field
   - Card holder name field
   - Expiry date field
   - CVV field
   - Submit button

### Option 2: Test in Main Application

1. Start the application:
   ```bash
   npm run dev
   ```

2. Login to the application

3. Click on the "Upgrade Plan" or pricing button

4. Select a paid plan (Pro or Business)

5. Click "Upgrade Now"

6. The payment form should appear showing:
   - HyperPay secure payment widget
   - Card input fields
   - Payment button

## Test Card Numbers

Use these test cards in HyperPay test mode:

| Brand | Card Number | CVV | Expiry | Result |
|-------|-------------|-----|--------|---------|
| VISA | 4200 0000 0000 0000 | Any 3 digits | Any future date | Success |
| VISA | 4000 0000 0000 0002 | Any 3 digits | Any future date | Declined |
| Master | 5300 0000 0000 0006 | Any 3 digits | Any future date | Success |
| Master | 5100 0000 0000 0008 | Any 3 digits | Any future date | Declined |
| MADA | 5297 4100 0000 0001 | Any 3 digits | Any future date | Success |

## How the Payment Widget Works

### 1. Checkout Creation
```javascript
// Frontend calls backend
POST /api/payment/checkout
{
  plan: "pro",
  billingCycle: "monthly",
  amount: 29,
  currency: "USD",
  userEmail: "user@example.com"
}

// Backend creates HyperPay checkout
Response: {
  success: true,
  checkoutId: "ABC123...",
  amount: 29,
  scriptUrl: "https://test.oppwa.com/v1/paymentWidgets.js",
  brands: ["VISA", "MASTER", "MADA"]
}
```

### 2. Widget Script Loading
```html
<!-- Script is dynamically loaded -->
<script src="https://test.oppwa.com/v1/paymentWidgets.js?checkoutId=ABC123..."></script>
```

### 3. Form Rendering
```html
<!-- HyperPay looks for this form and injects payment fields -->
<form 
  action="https://yoursite.com/payment-result" 
  class="paymentWidgets" 
  data-brands="VISA MASTER MADA"
>
  <!-- HyperPay automatically injects:
    - Card number input
    - Card holder name
    - Expiry date
    - CVV
    - Submit button
  -->
</form>
```

### 4. Payment Processing
When user submits the form:
1. HyperPay processes the payment
2. User is redirected to your `action` URL with payment result
3. Your app verifies the payment status
4. User plan is upgraded if payment successful

## Troubleshooting

### Widget Not Appearing

**Check 1: Is the script loading?**
```javascript
// Open browser console and check for:
console.log('HyperPay widget script loaded successfully');
```

**Check 2: Is the form element present?**
```javascript
// In browser console:
document.querySelector('.paymentWidgets')
// Should return the form element
```

**Check 3: Are there any console errors?**
- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab to see if script loaded (200 status)

**Check 4: Is the checkout ID valid?**
```javascript
// In browser console after clicking upgrade:
// You should see logs like:
// "Checkout created: { checkoutId: '...', amount: 29 }"
```

### Common Issues and Solutions

#### Issue: Form shows but no input fields
**Solution:** The checkout ID might be invalid. Check server logs for HyperPay API errors.

#### Issue: Script fails to load (404 or CORS error)
**Solution:** 
- Check your internet connection
- Verify HyperPay configuration in database:
  ```bash
  node scripts/checkHyperPayConfig.js
  ```
- Test connection:
  ```bash
  node scripts/testHyperPayConnection.js
  ```

#### Issue: Payment form loads but submission fails
**Solution:** 
- Verify the `action` URL is correct
- Check that return URL is whitelisted in HyperPay dashboard
- Ensure payment verification endpoint is working:
  ```bash
  curl http://localhost:3001/api/payment/verify/YOUR_CHECKOUT_ID
  ```

## Verification

After making these changes, verify:

1. ✅ Payment form displays with visible input fields
2. ✅ Card number, CVV, expiry, holder name fields are present
3. ✅ Submit button is visible
4. ✅ Form submits and processes payment
5. ✅ User is redirected back with payment result
6. ✅ Plan is upgraded on successful payment

## Next Steps

Once basic integration works:

1. **Styling**: Customize the widget appearance using HyperPay's styling options
2. **Error Handling**: Add better error messages for specific payment failures  
3. **Loading States**: Improve UX with better loading indicators
4. **Mobile**: Test on mobile devices and optimize layout
5. **Production**: Switch from test mode to live mode when ready

## Support

- HyperPay Documentation: https://wordpresshyperpay.docs.oppwa.com/
- Test Connection: `node scripts/testHyperPayConnection.js`
- Check Config: `node scripts/checkHyperPayConfig.js`
- Troubleshooting: See HYPERPAY_TROUBLESHOOTING.md
