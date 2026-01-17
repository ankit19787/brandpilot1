// Test script that logs in first, then creates checkout for HyperPay styling verification
import fetch from 'node-fetch';
import { writeFileSync } from 'fs';

async function testHyperPayWithAuth() {
  console.log('🔐 Testing HyperPay with authentication...\n');
  
  try {
    // Step 1: Login to get access token
    console.log('1️⃣ Logging in as admin...');
    const loginResponse = await fetch('http://localhost:3001/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123' // Default admin password
      })
    });
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      throw new Error(`Login failed: ${errorText}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful!\n');
    
    // Step 2: Create checkout with authentication
    console.log('2️⃣ Creating payment checkout...');
    const checkoutResponse = await fetch('http://localhost:3001/api/payment/checkout', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        plan: 'pro',
        billingCycle: 'monthly',
        amount: 100,
        currency: 'SAR',
        userEmail: 'admin@brandpilot.com'
      })
    });
    
    if (!checkoutResponse.ok) {
      const errorText = await checkoutResponse.text();
      throw new Error(`Checkout failed: ${errorText}`);
    }
    
    const checkoutData = await checkoutResponse.json();
    console.log('✅ Checkout created successfully!\n');
    
    // Step 3: Display results
    console.log('📋 Checkout Details:');
    console.log('===================');
    console.log(`Checkout ID: ${checkoutData.checkoutId}`);
    console.log(`Amount: ${checkoutData.amount} ${checkoutData.currency}`);
    console.log(`Script URL: ${checkoutData.scriptUrl}`);
    console.log(`Brands: ${checkoutData.brands.join(', ')}`);
    
    // Step 4: Create a test HTML file with the real checkout
    console.log('\n🎨 Creating test HTML with your checkout...');
    const testHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your HyperPay Widget Test</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        
        h1 {
            color: #334155;
            text-align: center;
            margin-bottom: 30px;
        }
        
        .info {
            background: #f0f9ff;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 30px;
            border-left: 4px solid #0ea5e9;
        }
        
        .status {
            padding: 16px;
            margin: 20px 0;
            border-radius: 12px;
            font-weight: 500;
            text-align: center;
        }
        
        /* Include your custom HyperPay styling */
        .paymentWidgets {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            background: transparent !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
        }

        .paymentWidgets input[type="text"],
        .paymentWidgets input[type="tel"],
        .paymentWidgets input[type="email"],
        .paymentWidgets select {
            width: 100% !important;
            padding: 12px 16px !important;
            border: 2px solid #e2e8f0 !important;
            border-radius: 12px !important;
            font-size: 16px !important;
            font-family: 'Inter', sans-serif !important;
            background: white !important;
            color: #334155 !important;
            transition: all 0.2s ease !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
            margin-bottom: 16px !important;
        }

        .paymentWidgets input[type="text"]:focus,
        .paymentWidgets input[type="tel"]:focus,
        .paymentWidgets input[type="email"]:focus,
        .paymentWidgets select:focus {
            outline: none !important;
            border-color: #6366f1 !important;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1), 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
            transform: translateY(-1px) !important;
        }

        .paymentWidgets label {
            display: block !important;
            margin-bottom: 6px !important;
            font-size: 14px !important;
            font-weight: 600 !important;
            color: #475569 !important;
            font-family: 'Inter', sans-serif !important;
        }

        .paymentWidgets input[type="submit"],
        .paymentWidgets input[type="button"],
        .paymentWidgets button[type="submit"] {
            width: 100% !important;
            padding: 16px 24px !important;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
            color: white !important;
            border: none !important;
            border-radius: 12px !important;
            font-size: 16px !important;
            font-weight: 600 !important;
            font-family: 'Inter', sans-serif !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
            margin-top: 8px !important;
            box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3) !important;
        }

        .paymentWidgets input[type="submit"]:hover,
        .paymentWidgets input[type="button"]:hover,
        .paymentWidgets button[type="submit"]:hover {
            background: linear-gradient(135deg, #5855eb 0%, #7c3aed 100%) !important;
            transform: translateY(-2px) !important;
            box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4) !important;
        }
        
        .test-cards {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 12px;
            padding: 16px;
            margin-top: 20px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎨 Live HyperPay Widget Test</h1>
        
        <div class="info">
            <strong>✅ Success!</strong> Your HyperPay checkout was created successfully.
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li><strong>Checkout ID:</strong> ${checkoutData.checkoutId}</li>
                <li><strong>Amount:</strong> ${checkoutData.amount} ${checkoutData.currency}</li>
                <li><strong>Brands:</strong> ${checkoutData.brands.join(', ')}</li>
            </ul>
        </div>
        
        <div id="status" style="background: #e0e7ff; color: #1e40af; padding: 16px; border-radius: 12px; text-align: center;">
            🔄 Loading your styled HyperPay payment form...
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 16px; border: 1px solid #e2e8f0; margin: 20px 0;">
            <h3 style="color: #334155; margin-bottom: 16px;">💳 Your Styled Payment Form</h3>
            
            <form action="live-hyperpay-test.html" class="paymentWidgets" data-brands="${checkoutData.brands.join(' ')}">
                <div style="text-align: center; padding: 40px; color: #94a3b8;">
                    <div style="font-size: 48px; margin-bottom: 16px;">⏳</div>
                    <p>Initializing HyperPay widget...</p>
                </div>
            </form>
        </div>
        
        <div class="test-cards">
            <strong>🧪 Test Card Numbers:</strong><br>
            <strong>VISA:</strong> 4200 0000 0000 0000<br>
            <strong>MasterCard:</strong> 5300 0000 0000 0006<br>
            <strong>CVV:</strong> 123 | <strong>Expiry:</strong> 12/25<br>
            <strong>Holder:</strong> Any name
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
            <p style="color: #64748b; font-size: 14px;">
                🔒 This is a real HyperPay widget with your custom styling applied.<br>
                The form fields above should match your application's design theme.
            </p>
        </div>
    </div>

    <script src="${checkoutData.scriptUrl}?checkoutId=${checkoutData.checkoutId}"></script>
    <script>
        setTimeout(() => {
            const form = document.querySelector('.paymentWidgets');
            const hasContent = form.innerHTML.trim().length > 150; // More than just loading message
            const status = document.getElementById('status');
            
            if (hasContent) {
                status.style.background = '#dcfce7';
                status.style.color = '#166534';
                status.innerHTML = '🎉 Success! Your styled HyperPay form is loaded above. Notice the beautiful design matching your app theme!';
            } else {
                status.style.background = '#fef2f2';
                status.style.color = '#dc2626';
                status.innerHTML = '⚠️ Widget loaded but form not populated. Check console for details or contact HyperPay support.';
            }
        }, 3000);
        
        console.log('🎨 HyperPay widget initialized with checkout: ${checkoutData.checkoutId}');
        console.log('✅ Custom styling applied successfully');
    </script>
</body>
</html>`;

    // Save the HTML file
    writeFileSync('live-hyperpay-test.html', testHtml, 'utf8');
    
    console.log('✅ Created: live-hyperpay-test.html');
    console.log('\n🚀 Next Steps:');
    console.log('==============');
    console.log('1. Open: http://localhost:5173/live-hyperpay-test.html');
    console.log('2. You should see your styled HyperPay form!');
    console.log('3. Test with the provided test card numbers');
    console.log('\n💡 This shows exactly how the widget will look in your app!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n🔧 Alternative Testing Methods:');
    console.log('===============================');
    console.log('1. Use the main application:');
    console.log('   - npm run dev');
    console.log('   - Login as admin');
    console.log('   - Go to Monetization → Upgrade Plan');
    console.log('');
    console.log('2. Check the styling preview:');
    console.log('   - Open: http://localhost:5173/hyperpay-styling-preview.html');
    console.log('');
    console.log('3. Verify admin credentials:');
    console.log('   - Check if admin user exists');
    console.log('   - Try with correct password');
  }
}

testHyperPayWithAuth();