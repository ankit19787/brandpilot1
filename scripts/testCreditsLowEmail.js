import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

async function testCreditsLowEmail() {
  console.log('\n=== Testing Credits Low Email Notification ===\n');
  
  try {
    // Find admin user
    const user = await prisma.user.findFirst({
      where: { email: { not: null } }
    });
    
    if (!user) {
      console.log('❌ No user with email found!');
      return;
    }
    
    console.log(`User: ${user.username}`);
    console.log(`Email: ${user.email}`);
    console.log(`Current Credits: ${user.credits}/${user.maxCredits}`);
    console.log(`Current Percentage: ${((user.credits / user.maxCredits) * 100).toFixed(2)}%\n`);
    
    // Calculate what credits would trigger the warning (20% of max)
    const warningThreshold = Math.floor(user.maxCredits * 0.20);
    console.log(`📊 Warning triggered when credits <= ${warningThreshold} (20% of ${user.maxCredits})\n`);
    
    // Set user credits to just above warning threshold for testing
    const testCredits = warningThreshold + 50;
    console.log(`Setting credits to ${testCredits} for testing...\n`);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { credits: testCredits }
    });
    
    // Now deduct credits to trigger warning
    const deductAmount = 100; // This will bring us below 20%
    console.log(`Deducting ${deductAmount} credits to trigger warning email...\n`);
    
    const response = await fetch('http://localhost:3001/api/user/credits/deduct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        amount: deductAmount,
        action: 'test_credits_low',
        description: 'Testing credits low email notification'
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.log('❌ API Error:', error);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Credits deducted successfully!');
    console.log(`   Before: ${result.transaction.balanceBefore}`);
    console.log(`   After: ${result.transaction.balanceAfter}`);
    console.log(`   Percentage: ${((result.transaction.balanceAfter / user.maxCredits) * 100).toFixed(2)}%\n`);
    
    if (result.transaction.balanceAfter <= warningThreshold) {
      console.log('📧 Credits Low Email should have been triggered!');
      console.log('📧 Check your inbox:', user.email);
      console.log('\nCheck server console for:');
      console.log('  "📧 Sending credits low email..."');
      console.log('  "✅ Email sent"\n');
    } else {
      console.log('⚠️  Credits still above warning threshold');
      console.log(`   Need to be at or below ${warningThreshold} to trigger email\n`);
    }
    
    // Restore original credits
    console.log('Restoring original credits...');
    await prisma.user.update({
      where: { id: user.id },
      data: { credits: user.credits }
    });
    console.log('✅ Credits restored\n');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3001/api/config');
    return response.ok;
  } catch {
    return false;
  }
}

const serverRunning = await checkServer();
if (!serverRunning) {
  console.log('\n❌ Server is not running on port 3001!');
  console.log('Start server first: node server.js\n');
  process.exit(1);
}

testCreditsLowEmail();
