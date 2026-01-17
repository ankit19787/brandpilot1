import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Seed users with hashed passwords
  console.log('👥 Seeding users...');
  const users = [
    { 
      username: 'admin', 
      passwordHash: crypto.createHash('sha256').update('admin123').digest('hex'),
      email: 'admin@brandpilot.com',
      role: 'admin',
      plan: 'enterprise',
      credits: 50000,
      maxCredits: 50000
    },
    { 
      username: 'demo', 
      passwordHash: crypto.createHash('sha256').update('demo123').digest('hex'),
      email: 'demo@brandpilot.com',
      role: 'user',
      plan: 'pro',
      credits: 10000,
      maxCredits: 10000
    }
  ];
  
  for (const user of users) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: user
    });
    console.log(`  ✓ Created user: ${user.username}`);
  }

  // Seed config from .env.local if it exists
  console.log('\n⚙️  Seeding configuration...');
  
  const configDefaults = [
    // Site configuration
    { key: 'backend_api_url', value: '' },
    { key: 'auto_post_enabled', value: 'false' },
    
    // Gemini AI
    { key: 'gemini_api_key', value: 'AIzaSyCYmBXpR24AzElOUibm5kIbE_jv9LBG8Hw' },
    
    // Facebook
    { key: 'facebook_app_id', value: '905104632049358' },
    { key: 'facebook_app_secret', value: '0b018e0f8887b45b650d95c533ff8b47' },
    { key: 'facebook_page_id', value: '767683059766101' },
    { key: 'facebook_token', value: 'EAAM3MBgT7s4BQf5VLgZBRUPgk2TvgZCGZBflAgSb13kclCNoXPjTdx0KFKW4pbF2UoOzfbZBMgSoJcXWwdbZAiGrJZApz37wxSyIYHWaovok tPKI2TtHhxUnl7ZBqFkmPdZAwM6lVY1ezgxLXBSjPUnC5laLQChbe9Jy2wVZAtMhcOcVZC4JKGcEDFZCUWy0verHBO7NS7b' },
    { key: 'facebook_api_url', value: 'https://graph.facebook.com' },
    { key: 'facebook_api_version', value: 'v20.0' },
    
    // Instagram
    { key: 'instagram_business_id', value: '17841478383986099' },
    { key: 'instagram_token', value: 'EAAM3MBgT7s4BQUqEw1CvKXxMZAkN2JVeiA3I36TrW9Ny0zWpNlFsEFSOeqeu93sCnKZC7c80NXyZBjekpcNaE0xTWJ10fAZCi3cXvnyVl9bmhJxl6ZB3iRiyhjHTkjDa777JNS3HwdaHUdYSFBZCkPw6TQaR9WWZAgVs47OSqT8t8rCwcgXrwIZAg09YewiI1shYYwZDZD' },
    { key: 'instagram_api_url', value: 'https://graph.facebook.com' },
    { key: 'instagram_caption_length', value: '300' },
    
    // Twitter/X
    { key: 'x_api_key', value: 'HflU4WImFWhstYLkJXpsEBkDU' },
    { key: 'x_api_secret', value: 'SJAxdxRYggpVhUteAX96k7NOX3520PNoUmgjMDiAQbdILdh9wv' },
    { key: 'x_access_token', value: '1995694849396502528-dKhySjeOvaw4O3RbDczYY1G11RQ8io' },
    { key: 'x_access_secret', value: '9ajfYpuiaHyYZxk85DvrU6Zx778juimWuJHwXgkHZcbdq' },
    { key: 'twitter_api_url', value: 'https://api.twitter.com' },
    
    // Cloudinary
    { key: 'cloudinary_cloud_name', value: 'dbcobjgkv' },
    { key: 'cloudinary_api_key', value: '576315971575224' },
    { key: 'cloudinary_api_secret', value: 'ICth7Yh-oC11z0mF6afINmPwchs' },
    { key: 'cloudinary_api_version', value: 'v1_1' },
    { key: 'cloudinary_api_url', value: 'https://api.cloudinary.com' },
    
    // Email Configuration
    { key: 'email_host', value: 'smtp.gmail.com' },
    { key: 'email_port', value: '587' },
    { key: 'email_secure', value: 'false' },
    { key: 'email_user', value: 'ankit19787@gmail.com' },
    { key: 'email_pass', value: 'bddq nayn fbxg ztch' },
    { key: 'email_from', value: 'noreply@brandpilot.com' },
    
    // HyperPay Configuration
    { key: 'hyperpay_entity_id', value: '8ac7a4c994aeea4d0194b1e58b280403' },
    { key: 'hyperpay_access_token', value: 'OGFjN2E0Yzk5NGFlZWE0ZDAxOTRiMWU0NWI2ZTAzZmZ8eDlqWjNxMkNOVUxOPVAlSG9waiU=' },
    { key: 'hyperpay_mode', value: 'eu-test' },
    { key: 'hyperpay_brands', value: 'VISA,MADA' },
    
    // Database
    { key: 'DATABASE_URL', value: 'postgresql://postgres:12345678@localhost:5433/brandpilot' }
  ];

  // Try to load from .env.local if it exists
  if (fs.existsSync('./.env.local')) {
    console.log('  📄 Loading values from .env.local...');
    const envFile = fs.readFileSync('./.env.local', 'utf-8');
    const envMap = new Map();
    
    for (const line of envFile.split('\n')) {
      const match = line.match(/^#?\s*([A-Za-z0-9_]+)=(.*)$/);
      if (match) {
        let key = match[1].trim();
        let value = match[2].trim().replace(/^["']|["']$/g, '');
        
        // Map VITE_ keys to config keys
        if (key.startsWith('VITE_')) {
          key = key.replace('VITE_', '').toLowerCase();
        }
        
        // Special mappings
        if (key === 'api_key') key = 'gemini_api_key';
        if (key === 'facebook_production_token') key = 'facebook_token';
        if (key === 'instagram_wa_token') key = 'instagram_token';
        
        envMap.set(key.toLowerCase(), value);
      }
    }
    
    // Update defaults with env values
    for (const config of configDefaults) {
      const envValue = envMap.get(config.key.toLowerCase());
      if (envValue) {
        config.value = envValue;
      }
    }
  }

  // Upsert all config entries
  for (const config of configDefaults) {
    await prisma.config.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config
    });
    const displayValue = config.value ? '✓' : '(empty)';
    console.log(`  ✓ ${config.key}: ${displayValue}`);
  }

  // Seed a sample post
  console.log('\n📝 Seeding sample content...');
  const admin = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (admin) {
    const post = await prisma.post.create({
      data: {
        userId: admin.id,
        platform: 'facebook',
        content: 'Welcome to BrandPilot OS! 🚀\n\nYour AI-powered social media management platform is ready to help you create, schedule, and publish amazing content across all your platforms.',
        status: 'draft',
        createdAt: new Date()
      }
    });
    console.log(`  ✓ Created sample post (ID: ${post.id})`);
  }

  console.log('\n✅ Database seeded successfully!\n');
  console.log('📌 Next steps:');
  console.log('   1. Update API keys in the Config table or .env.local');
  console.log('   2. Run: npm run server');
  console.log('   3. Run: npm run dev');
  console.log('   4. Login with: admin / admin123\n');
}

main()
  .catch(e => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
