import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed users
  const users = [
    { username: 'admin', passwordHash: 'admin123', role: 'admin' },
    { username: 'demo1', passwordHash: 'demo123', role: 'user' },
    { username: 'demo2', passwordHash: 'demo123', role: 'user' }
  ];
  for (const user of users) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: user
    });
  }

  // Seed posts and log creation
  const admin = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (admin) {
    const post = await prisma.post.create({
      data: {
        userId: admin.id,
        platform: 'facebook',
        content: 'Welcome to BrandPilot OS!',
        status: 'published',
        createdAt: new Date()
      }
    });
    await prisma.log.create({
      data: {
        userId: admin.id,
        action: 'post_created',
        details: `Post created for platform: facebook, postId: ${post.id}, imageUrl: ${post.imageUrl || 'none'}`,
        createdAt: new Date()
      }
    });
  }

  // Seed config
  await prisma.config.upsert({
    where: { key: 'site_name' },
    update: { value: 'BrandPilot OS' },
    create: { key: 'site_name', value: 'BrandPilot OS' }
  });

  // Seed social platform config
  const platformConfigs = [
    { key: 'facebook_token', value: 'your-facebook-token' },
    { key: 'instagram_token', value: 'your-instagram-token' },
    { key: 'twitter_api_key', value: 'your-twitter-api-key' },
    { key: 'twitter_api_secret', value: 'your-twitter-api-secret' },
    { key: 'cloudinary_api_key', value: 'your-cloudinary-api-key' },
    { key: 'cloudinary_api_secret', value: 'your-cloudinary-api-secret' }
  ];
  for (const config of platformConfigs) {
    await prisma.config.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config
    });
  }

  // Seed log for initial seed
  if (admin) {
    await prisma.log.create({
      data: {
        userId: admin.id,
        action: 'seed',
        details: 'Initial seed data created',
        createdAt: new Date()
      }
    });
  }

  console.log('Database seeded successfully');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
