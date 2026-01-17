// Simple test script to create a HyperPay checkout for styling verification
import fetch from 'node-fetch';

async function createTestCheckout() {
  console.log('🧪 Creating test HyperPay checkout...\n');
  
  try {
    const response = await fetch('http://localhost:3001/api/payment/checkout', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        plan: 'pro',
        billingCycle: 'monthly',
        amount: 100,
        currency: 'SAR',
        userEmail: 'admin'
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Checkout created successfully!');
    console.log('================================');
    console.log(`Checkout ID: ${data.checkoutId}`);
    console.log(`Amount: ${data.amount} ${data.currency}`);
    console.log(`Script URL: ${data.scriptUrl}`);
    console.log(`Brands: ${data.brands.join(', ')}`);
    
    console.log('\n🌐 Test the styled widget:');
    console.log('==========================');
    console.log(`1. Open: http://localhost:5173/hyperpay-styling-preview.html`);
    console.log(`2. Or manually create HTML with this checkout ID: ${data.checkoutId}`);
    console.log(`3. Load script: ${data.scriptUrl}?checkoutId=${data.checkoutId}`);
    
    console.log('\n📝 HTML Test Code:');
    console.log('==================');
    console.log(`<form class="paymentWidgets" data-brands="${data.brands.join(' ')}"></form>`);
    console.log(`<script src="${data.scriptUrl}?checkoutId=${data.checkoutId}"></script>`);
    
    return data;
    
  } catch (error) {
    console.error('❌ Failed to create checkout:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('===================');
    console.log('1. Make sure your server is running: node server.js');
    console.log('2. Check HyperPay configuration: node scripts/checkHyperPayConfig.js');
    console.log('3. Verify access token is valid');
    console.log('4. Check server logs for detailed errors');
    
    return null;
  }
}

createTestCheckout();