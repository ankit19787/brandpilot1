import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnoseLiveTest() {
  console.log('\n🔍 HyperPay Widget Diagnostic Test\n');
  console.log('This will create a test checkout and show you the exact widget URL to test in your browser.\n');
  
  try {
    // Load config
    const configs = await prisma.config.findMany({
      where: { key: { startsWith: 'HYPERPAY' } }
    });
    
    const configMap = {};
    configs.forEach(c => configMap[c.key] = c.value);
    
    if (!configMap.HYPERPAY_ENTITY_ID || !configMap.HYPERPAY_ACCESS_TOKEN) {
      console.log('❌ HyperPay not configured');
      return;
    }
    
    // Create test checkout
    console.log('📝 Creating test checkout...');
    
    const requestData = {
      entityId: configMap.HYPERPAY_ENTITY_ID,
      amount: '1.00',
      currency: 'USD',
      paymentType: 'DB',
      merchantTransactionId: `test_${Date.now()}`,
      'customer.email': 'test@example.com'
    };
    
    const mode = configMap.HYPERPAY_MODE || 'test';
    const baseUrl = mode === 'live' ? 'https://oppwa.com/v1' : 'https://test.oppwa.com/v1';
    
    const response = await fetch(`${baseUrl}/checkouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${configMap.HYPERPAY_ACCESS_TOKEN}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(requestData).toString()
    });
    
    const data = await response.json();
    
    if (!response.ok || !data.id) {
      console.log('❌ Failed to create checkout');
      console.log('Response:', JSON.stringify(data, null, 2));
      return;
    }
    
    console.log('✅ Checkout created successfully!');
    console.log('   Checkout ID:', data.id);
    console.log('   Result:', data.result.description);
    console.log('');
    
    // Generate URLs
    const scriptUrl = `${mode === 'live' ? 'https://oppwa.com' : 'https://test.oppwa.com'}/v1/paymentWidgets.js?checkoutId=${data.id}`;
    const brands = configMap.HYPERPAY_BRANDS || 'VISA,MASTER,MADA';
    
    console.log('📋 WIDGET INTEGRATION CODE:');
    console.log('================================');
    console.log('<!-- Add this script to your page -->');
    console.log(`<script src="${scriptUrl}"></script>`);
    console.log('');
    console.log('<!-- Add this form where you want the payment widget -->');
    console.log(`<form action="YOUR_RETURN_URL" class="paymentWidgets" data-brands="${brands.replace(/,/g, ' ')}"></form>`);
    console.log('================================\n');
    
    console.log('🌐 TEST IN BROWSER:');
    console.log('================================');
    console.log('1. Create a simple HTML file with this content:');
    console.log('');
    console.log('<!DOCTYPE html>');
    console.log('<html><head><title>HyperPay Test</title></head><body>');
    console.log('  <h1>HyperPay Payment Widget Test</h1>');
    console.log(`  <form action="test-result.html" class="paymentWidgets" data-brands="${brands.replace(/,/g, ' ')}"></form>`);
    console.log(`  <script src="${scriptUrl}"></script>`);
    console.log('</body></html>');
    console.log('');
    console.log('2. Open it in your browser');
    console.log('3. You should see card input fields');
    console.log('================================\n');
    
    console.log('🧪 QUICK BROWSER TEST:');
    console.log('================================');
    console.log('Open your browser console (F12) and paste this:');
    console.log('');
    console.log('// Create form');
    console.log('const form = document.createElement("form");');
    console.log('form.className = "paymentWidgets";');
    console.log(`form.setAttribute("data-brands", "${brands.replace(/,/g, ' ')}");`);
    console.log('form.setAttribute("action", window.location.href);');
    console.log('document.body.appendChild(form);');
    console.log('');
    console.log('// Load script');
    console.log('const script = document.createElement("script");');
    console.log(`script.src = "${scriptUrl}";`);
    console.log('document.body.appendChild(script);');
    console.log('');
    console.log('// Check after 2 seconds');
    console.log('setTimeout(() => console.log("Form HTML:", form.innerHTML), 2000);');
    console.log('================================\n');
    
    console.log('💳 TEST CARDS:');
    console.log('   VISA: 4200 0000 0000 0000');
    console.log('   Master: 5300 0000 0000 0006');
    console.log('   CVV: Any 3 digits');
    console.log('   Expiry: Any future date\n');
    
    console.log('⏰ Note: This checkout ID expires in 30 minutes.\n');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseLiveTest();
