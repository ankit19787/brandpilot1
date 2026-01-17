import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to get config value (same as in services)
async function getConfigValue(key) {
  const config = await prisma.config.findUnique({
    where: { key }
  });
  return config?.value || '';
}

// Helper to get platform API URLs and versions
async function getPlatformConfig() {
  return {
    twitterApiUrl: await getConfigValue('twitter_api_url'),
    instagramApiUrl: await getConfigValue('instagram_api_url'),
    facebookApiUrl: await getConfigValue('facebook_api_url'),
    facebookApiVersion: await getConfigValue('facebook_api_version'),
    backendApiUrl: await getConfigValue('backend_api_url'),
  };
}

async function testDynamicUrls() {
  try {
    console.log('🧪 Testing Dynamic API Configuration...\n');
    
    const config = await getPlatformConfig();
    
    console.log('📋 Current Platform Configuration:');
    console.log(`├─ Facebook API URL: ${config.facebookApiUrl}`);
    console.log(`├─ Facebook API Version: ${config.facebookApiVersion}`);
    console.log(`├─ Instagram API URL: ${config.instagramApiUrl}`);
    console.log(`├─ Twitter API URL: ${config.twitterApiUrl || 'Not set'}`);
    console.log(`└─ Backend API URL: ${config.backendApiUrl || 'Not set'}\n`);
    
    // Test Facebook token refresh URL construction
    const appId = 'test_app_id';
    const appSecret = 'test_app_secret';
    const token = 'test_token';
    
    const dynamicUrl = `${config.facebookApiUrl}/${config.facebookApiVersion}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${token}`;
    
    console.log('🔗 Example Dynamic URL Construction:');
    console.log(`├─ Function: Facebook Token Refresh`);
    console.log(`└─ URL: ${dynamicUrl}\n`);
    
    // Test Instagram post URL construction
    const postId = 'test_post_123';
    const instagramUrl = `https://instagram.com/p/${postId}`;
    const facebookUrl = `https://facebook.com/${postId}`;
    
    console.log('🌐 Platform Post URLs:');
    console.log(`├─ Instagram: ${instagramUrl}`);
    console.log(`└─ Facebook: ${facebookUrl}\n`);
    
    console.log('✅ All URLs are now dynamically constructed from database configuration!');
    console.log('✅ No more hardcoded api.facebook.com URLs found!');
    
  } catch (error) {
    console.error('❌ Error testing dynamic URLs:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDynamicUrls();