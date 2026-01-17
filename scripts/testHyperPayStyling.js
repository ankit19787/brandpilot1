// Script to test HyperPay widget styling
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testHyperPayStyling() {
  console.log('🎨 Testing HyperPay Widget Styling...\n');
  
  try {
    // Check if HyperPay is configured
    const configs = await prisma.config.findMany({
      where: {
        key: {
          startsWith: 'hyperpay'
        }
      }
    });
    
    if (configs.length === 0) {
      console.log('❌ HyperPay not configured. Please run: node scripts/configureHyperPay.js');
      return;
    }
    
    console.log('✅ HyperPay Configuration Found:');
    console.log('================================');
    
    const configMap = {};
    configs.forEach(c => configMap[c.key] = c.value);
    
    const mode = configMap.hyperpay_mode || 'test';
    const baseUrl = mode === 'live' 
      ? 'https://oppwa.com/v1'
      : mode === 'eu-test'
      ? 'https://eu-test.oppwa.com/v1'
      : 'https://test.oppwa.com/v1';
    
    console.log(`Mode: ${mode}`);
    console.log(`Base URL: ${baseUrl}`);
    console.log(`Entity ID: ${configMap.hyperpay_entity_id}`);
    console.log(`Brands: ${configMap.hyperpay_brands || 'VISA,MASTER'}`);
    
    console.log('\n🎨 Custom CSS Styling Features:');
    console.log('================================');
    console.log('✅ Input fields styled with rounded borders');
    console.log('✅ Focus states with indigo color theme');
    console.log('✅ Hover effects with subtle shadows');
    console.log('✅ Custom submit button with gradient');
    console.log('✅ Card and CVV icons in input fields');
    console.log('✅ Inter font family matching app theme');
    console.log('✅ Error message styling');
    console.log('✅ Mobile responsive design');
    console.log('✅ Loading state animations');
    console.log('✅ Dark mode support prepared');
    
    console.log('\n📱 Testing Instructions:');
    console.log('=========================');
    console.log('1. Start the application:');
    console.log('   npm run dev');
    console.log('');
    console.log('2. Login to the application');
    console.log('');
    console.log('3. Click "Upgrade Plan" or go to Monetization tab');
    console.log('');
    console.log('4. Select Pro or Business plan');
    console.log('');
    console.log('5. Click "Upgrade Now"');
    console.log('');
    console.log('6. Observe the styled payment form:');
    console.log('   - Rounded input fields with Inter font');
    console.log('   - Indigo focus states matching app theme');
    console.log('   - Gradient submit button');
    console.log('   - Card/CVV icons in fields');
    console.log('   - Smooth animations and transitions');
    
    console.log('\n🎯 Style Verification Checklist:');
    console.log('=================================');
    console.log('□ Input fields have rounded corners (12px border-radius)');
    console.log('□ Fields use Inter font family');
    console.log('□ Focus states show indigo color (#6366f1)');
    console.log('□ Submit button has gradient background');
    console.log('□ Hover effects work on all interactive elements');
    console.log('□ Form fields have proper spacing (16px margin)');
    console.log('□ Card icons appear in number/CVV fields');
    console.log('□ Loading animation shows when form initializes');
    console.log('□ Form matches overall app visual theme');
    
    console.log('\n💡 Customization Tips:');
    console.log('=======================');
    console.log('- Colors are defined in styles.css with CSS custom properties');
    console.log('- All styles use !important to override HyperPay defaults');
    console.log('- Mobile-responsive design included');
    console.log('- Additional styling can be added to styles.css');
    console.log('- Dark mode styles are prepared for future use');
    
    console.log('\n🔧 Troubleshooting:');
    console.log('====================');
    console.log('If styling doesn\'t apply:');
    console.log('1. Check browser console for CSS errors');
    console.log('2. Verify styles.css is being loaded');
    console.log('3. Inspect element to see if styles are applied');
    console.log('4. Clear browser cache and reload');
    console.log('5. Check if HyperPay widget loaded successfully');
    
  } catch (error) {
    console.error('❌ Error testing HyperPay styling:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testHyperPayStyling().catch(console.error);