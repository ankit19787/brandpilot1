import { PrismaClient } from '@prisma/client';
import HyperPayService from '../services/hyperPayService.js';
import dns from 'dns';
import { promisify } from 'util';

const lookup = promisify(dns.lookup);
const prisma = new PrismaClient();

async function testHyperPayConnection() {
  try {
    console.log('\n🔍 Testing HyperPay Connection...\n');
    
    // Step 1: Test DNS resolution
    console.log('Step 1: Testing DNS resolution for test.oppwa.com...');
    try {
      const address = await lookup('test.oppwa.com');
      console.log('✅ DNS resolved:', address);
    } catch (dnsError) {
      console.log('❌ DNS resolution failed:', dnsError.message);
      console.log('\nPossible solutions:');
      console.log('1. Check your internet connection');
      console.log('2. Try flushing DNS cache: ipconfig /flushdns');
      console.log('3. Check if a firewall is blocking DNS requests');
      console.log('4. Try using a different DNS server (e.g., 8.8.8.8)');
      return;
    }
    
    // Step 2: Load HyperPay config
    console.log('\nStep 2: Loading HyperPay configuration from database...');
    const configs = await prisma.config.findMany({
      where: {
        key: {
          in: ['HYPERPAY_ENTITY_ID', 'HYPERPAY_ACCESS_TOKEN', 'HYPERPAY_MODE', 'HYPERPAY_BRANDS']
        }
      }
    });
    
    const configMap = {};
    configs.forEach(c => configMap[c.key] = c.value);
    
    if (!configMap.HYPERPAY_ENTITY_ID || !configMap.HYPERPAY_ACCESS_TOKEN) {
      console.log('❌ Missing required HyperPay configuration');
      return;
    }
    
    const hyperPayConfig = {
      entityId: configMap.HYPERPAY_ENTITY_ID,
      accessToken: configMap.HYPERPAY_ACCESS_TOKEN,
      mode: configMap.HYPERPAY_MODE || 'test',
      brands: (configMap.HYPERPAY_BRANDS || 'VISA,MASTER').split(',')
    };
    
    console.log('✅ Configuration loaded');
    console.log('   Mode:', hyperPayConfig.mode);
    console.log('   Entity ID:', hyperPayConfig.entityId);
    console.log('   Brands:', hyperPayConfig.brands.join(', '));
    
    // Step 3: Test basic fetch to HyperPay
    console.log('\nStep 3: Testing connection to HyperPay API...');
    const baseUrl = hyperPayConfig.mode === 'live' 
      ? 'https://oppwa.com/v1'
      : 'https://test.oppwa.com/v1';
    
    console.log('   URL:', baseUrl);
    
    try {
      const testUrl = `${baseUrl}/checkouts`;
      console.log('   Testing POST to:', testUrl);
      
      const requestData = {
        entityId: hyperPayConfig.entityId,
        amount: '1.00',
        currency: 'USD',
        paymentType: 'DB',
        merchantTransactionId: `test_${Date.now()}`,
        'customer.email': 'test@example.com'
      };
      
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hyperPayConfig.accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(requestData).toString()
      });
      
      console.log('   Response status:', response.status);
      
      const data = await response.json();
      console.log('   Response data:', JSON.stringify(data, null, 2));
      
      if (response.ok || data.id) {
        console.log('\n✅ Successfully connected to HyperPay API!');
        console.log('   Checkout ID:', data.id);
      } else {
        console.log('\n⚠️  API request completed but returned an error:');
        console.log('   Code:', data.result?.code);
        console.log('   Description:', data.result?.description);
      }
      
    } catch (fetchError) {
      console.log('❌ Fetch failed:', fetchError.message);
      console.log('\nError details:', fetchError);
      
      if (fetchError.cause) {
        console.log('\nRoot cause:', fetchError.cause);
      }
      
      console.log('\nPossible solutions:');
      console.log('1. Check your internet connection');
      console.log('2. Verify no firewall is blocking HTTPS requests');
      console.log('3. Try accessing https://test.oppwa.com in your browser');
      console.log('4. Check if you need to configure a proxy');
      console.log('5. Temporarily disable antivirus/firewall to test');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testHyperPayConnection();
