import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserPlan() {
  try {
    console.log('\n📊 Checking all users and their plans...\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        plan: true,
        credits: true,
        maxCredits: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Username: ${user.username}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Plan: ${user.plan.toUpperCase()}`);
      console.log(`  Credits: ${user.credits} / ${user.maxCredits}`);
      console.log(`  Created: ${user.createdAt}`);
      console.log(`  Updated: ${user.updatedAt}`);
      console.log('');
    });

    // Check subscriptions
    console.log('📝 Checking subscriptions...\n');
    const subscriptions = await prisma.subscription.findMany({
      include: {
        user: {
          select: {
            username: true
          }
        }
      }
    });

    if (subscriptions.length === 0) {
      console.log('❌ No subscriptions found');
    } else {
      subscriptions.forEach((sub, index) => {
        console.log(`Subscription ${index + 1}:`);
        console.log(`  User: ${sub.user.username}`);
        console.log(`  Plan: ${sub.plan.toUpperCase()}`);
        console.log(`  Status: ${sub.status}`);
        console.log(`  Period: ${sub.currentPeriodStart} → ${sub.currentPeriodEnd}`);
        console.log('');
      });
    }

    // Check recent credit transactions
    console.log('💳 Recent credit transactions...\n');
    const transactions = await prisma.creditTransaction.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            username: true
          }
        }
      }
    });

    if (transactions.length === 0) {
      console.log('❌ No transactions found');
    } else {
      transactions.forEach((tx, index) => {
        console.log(`Transaction ${index + 1}:`);
        console.log(`  User: ${tx.user.username}`);
        console.log(`  Action: ${tx.action}`);
        console.log(`  Amount: ${tx.amount > 0 ? '+' : ''}${tx.amount}`);
        console.log(`  Balance: ${tx.balanceBefore} → ${tx.balanceAfter}`);
        console.log(`  Time: ${tx.createdAt}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserPlan();
