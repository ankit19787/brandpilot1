// Seed script to populate Config table with all required keys for social and app credentials
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();

const envFile = fs.readFileSync('./.env.local', 'utf-8');
const configEntries = [];
for (const line of envFile.split('\n')) {
  const match = line.match(/^#?\s*([A-Za-z0-9_]+)=(.*)$/);
  if (match) {
    let key = match[1].trim();
    let value = match[2].trim().replace(/^"|"$/g, '');
    // Map VITE_ keys to config keys
    if (key.startsWith('VITE_')) key = key.replace('VITE_', '').toLowerCase();
    if (key === 'api_key') key = 'gemini_api_key';
    if (key === 'facebook_production_token') key = 'facebook_token';
    if (key === 'instagram_wa_token') key = 'instagram_token';
    configEntries.push({ key, value });
  }
}

async function seedConfig() {
  for (const entry of configEntries) {
    await prisma.config.upsert({
      where: { key: entry.key },
      update: { value: entry.value },
      create: { key: entry.key, value: entry.value },
    });
    console.log(`Seeded config: ${entry.key}`);
  }
  await prisma.$disconnect();
  console.log('Config table seeded.');
}

seedConfig();