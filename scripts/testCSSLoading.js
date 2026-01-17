// Simple test to verify HyperPay CSS is loading
console.log('🎨 Testing HyperPay CSS Application...\n');

// Test if styles.css is accessible
fetch('http://localhost:5173/styles.css')
  .then(response => response.text())
  .then(css => {
    const hasHyperPayStyles = css.includes('paymentWidgets');
    const hasEnhancedStyles = css.includes('Enhanced HyperPay Widget Styling with Maximum Specificity');
    const hasWpwlStyles = css.includes('wpwl-form');
    
    console.log('✅ CSS File Status:');
    console.log('===================');
    console.log(`📄 CSS file size: ${css.length} characters`);
    console.log(`🎨 Contains HyperPay styles: ${hasHyperPayStyles ? '✅ YES' : '❌ NO'}`);
    console.log(`⚡ Contains enhanced styles: ${hasEnhancedStyles ? '✅ YES' : '❌ NO'}`);
    console.log(`🔧 Contains WPWL styles: ${hasWpwlStyles ? '✅ YES' : '❌ NO'}`);
    
    if (hasHyperPayStyles && hasEnhancedStyles) {
      console.log('\n🎉 SUCCESS: Enhanced HyperPay styling is available!');
      console.log('\n📋 Next Steps:');
      console.log('==============');
      console.log('1. Open your application: http://localhost:5173');
      console.log('2. Login to your account');
      console.log('3. Go to Monetization tab');
      console.log('4. Click "Upgrade Plan" → Select Pro/Business → "Upgrade Now"');
      console.log('5. You should now see the styled HyperPay form!');
      console.log('\n💡 If you still see old styling:');
      console.log('- Press Ctrl+Shift+R to hard refresh');
      console.log('- Clear browser cache');
      console.log('- Try incognito/private browsing mode');
    } else {
      console.log('\n❌ ISSUE: Enhanced HyperPay styles not found in CSS file');
      console.log('The styles.css file might not have been updated properly.');
      console.log('\n🔍 Debug info:');
      console.log(`- File includes "Enhanced HyperPay": ${css.includes('Enhanced HyperPay')}`);
      console.log(`- File includes "Maximum Specificity": ${css.includes('Maximum Specificity')}`);
      console.log(`- File includes ".wpwl-": ${css.includes('.wpwl-')}`);
    }
  })
  .catch(error => {
    console.error('❌ Error loading CSS file:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('- Make sure Vite dev server is running');
    console.log('- Check if styles.css exists');
    console.log('- Restart the dev server: npm run dev');
  });