import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function updateTwitterTokens() {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  console.log('🔑 Twitter Token Update Tool');
  console.log('=====================================\n');
  console.log('After changing your Twitter app permissions to "Read and Write",');
  console.log('you MUST regenerate your Access Token & Secret.\n');

  const apiKey = await question('Enter x_api_key (Consumer Key): ');
  const apiSecret = await question('Enter x_api_secret (Consumer Secret): ');
  const accessToken = await question('Enter x_access_token (Access Token): ');
  const accessSecret = await question('Enter x_access_secret (Access Token Secret): ');

  try {
    await prisma.config.upsert({
      where: { key: 'x_api_key' },
      update: { value: apiKey },
      create: { key: 'x_api_key', value: apiKey }
    });

    await prisma.config.upsert({
      where: { key: 'x_api_secret' },
      update: { value: apiSecret },
      create: { key: 'x_api_secret', value: apiSecret }
    });

    await prisma.config.upsert({
      where: { key: 'x_access_token' },
      update: { value: accessToken },
      create: { key: 'x_access_token', value: accessToken }
    });

    await prisma.config.upsert({
      where: { key: 'x_access_secret' },
      update: { value: accessSecret },
      create: { key: 'x_access_secret', value: accessSecret }
    });

    console.log('\n✅ All Twitter credentials updated successfully!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

updateTwitterTokens();
