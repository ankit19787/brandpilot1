import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  // List of config keys to store
  const configKeys = [
    'VITE_TWITTER_API_URL',
    'VITE_INSTAGRAM_API_URL',
    'VITE_FACEBOOK_API_URL',
    'VITE_FACEBOOK_API_VERSION',
    'VITE_API_KEY',
    'VITE_INSTAGRAM_WA_TOKEN',
    'VITE_FACEBOOK_PRODUCTION_TOKEN',
    'VITE_X_API_KEY',
    'VITE_X_API_SECRET',
    'VITE_X_ACCESS_TOKEN',
    'VITE_X_ACCESS_SECRET',
    'VITE_INSTAGRAM_BUSINESS_ID',
    'VITE_FACEBOOK_PAGE_ID',
    'VITE_FACEBOOK_APP_ID',
    'VITE_FACEBOOK_APP_SECRET',
    'VITE_CLOUDINARY_API_KEY',
    'VITE_CLOUDINARY_API_SECRET',
    'VITE_CLOUDINARY_CLOUD_NAME',
    'VITE_INSTAGRAM_CAPTION_LENGTH'
  ];

  for (const key of configKeys) {
    const value = process.env[key];
    if (value) {
      await prisma.config.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      });
    }
  }

  console.log('All credentials/configs from .env.local stored in database.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
