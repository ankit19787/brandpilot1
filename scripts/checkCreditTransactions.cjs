const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCreditTransactions() {
  try {
    console.log('🔍 Checking Credit Transactions\n');
    
    // Get all credit transactions, sorted by most recent
    const transactions = await prisma.creditTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            credits: true
          }
        }
      }
    });
    
    console.log(`Found ${transactions.length} recent transactions:\n`);
    
    // Group by action to find duplicates
    const byAction = {};
    const byDescription = {};
    
    transactions.forEach(tx => {
      const key = `${tx.action}_${tx.description}`;
      if (!byDescription[key]) {
        byDescription[key] = [];
      }
      byDescription[key].push(tx);
      
      if (!byAction[tx.action]) {
        byAction[tx.action] = [];
      }
      byAction[tx.action].push(tx);
    });
    
    // Show summary by action
    console.log('📊 Transactions by Action:');
    Object.keys(byAction).forEach(action => {
      console.log(`   ${action}: ${byAction[action].length} transactions`);
    });
    
    console.log('\n🔎 Checking for Duplicate Publish Transactions...\n');
    
    // Look for potential duplicates (same description within short time period)
    Object.keys(byDescription).forEach(key => {
      const txs = byDescription[key];
      if (txs.length > 1) {
        console.log(`⚠️  Found ${txs.length} transactions with same description:`);
        console.log(`   Description: ${txs[0].description}`);
        console.log(`   Action: ${txs[0].action}`);
        console.log(`   Timestamps:`);
        txs.forEach((tx, index) => {
          console.log(`      ${index + 1}. ${tx.createdAt.toISOString()} - ${tx.amount} credits - Balance: ${tx.balanceAfter}`);
        });
        
        // Check time difference
        if (txs.length >= 2) {
          const timeDiff = Math.abs(new Date(txs[0].createdAt) - new Date(txs[1].createdAt));
          console.log(`   Time between first two: ${timeDiff}ms (${(timeDiff/1000).toFixed(2)}s)`);
        }
        console.log('');
      }
    });
    
    // Show detailed recent transactions
    console.log('\n📜 Recent 20 Transactions:\n');
    transactions.slice(0, 20).forEach((tx, index) => {
      console.log(`${index + 1}. ${tx.createdAt.toISOString()}`);
      console.log(`   User: ${tx.user.username} (${tx.user.id})`);
      console.log(`   Action: ${tx.action}`);
      console.log(`   Amount: ${tx.amount > 0 ? '+' : ''}${tx.amount} credits`);
      console.log(`   Balance: ${tx.balanceBefore} → ${tx.balanceAfter}`);
      console.log(`   Description: ${tx.description}`);
      console.log('');
    });
    
    // Check for publish actions specifically
    const publishActions = transactions.filter(tx => 
      tx.action === 'content_publish' || 
      tx.description.toLowerCase().includes('publish')
    );
    
    if (publishActions.length > 0) {
      console.log(`\n🚀 Found ${publishActions.length} publish-related transactions:`);
      publishActions.forEach((tx, index) => {
        console.log(`\n${index + 1}. ${tx.createdAt.toISOString()}`);
        console.log(`   Amount: ${tx.amount} credits`);
        console.log(`   Description: ${tx.description}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCreditTransactions();