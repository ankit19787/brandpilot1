/**
 * Check for duplicate email addresses in the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDuplicateEmails() {
  console.log('🔍 Checking for duplicate email addresses...');
  
  try {
    // Find all users with emails
    const usersWithEmails = await prisma.user.findMany({
      where: {
        email: {
          not: null
        }
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true
      },
      orderBy: {
        email: 'asc'
      }
    });
    
    console.log(`📊 Found ${usersWithEmails.length} users with email addresses`);
    
    // Group by email to find duplicates
    const emailGroups = {};
    for (const user of usersWithEmails) {
      const email = user.email.toLowerCase();
      if (!emailGroups[email]) {
        emailGroups[email] = [];
      }
      emailGroups[email].push(user);
    }
    
    // Find duplicates
    const duplicates = {};
    for (const [email, users] of Object.entries(emailGroups)) {
      if (users.length > 1) {
        duplicates[email] = users;
      }
    }
    
    console.log('\n📋 Duplicate Email Analysis:');
    console.log('=' .repeat(50));
    
    if (Object.keys(duplicates).length === 0) {
      console.log('✅ No duplicate email addresses found!');
      console.log('✅ Safe to add unique constraint on email field');
      
      console.log('\n📊 Email Statistics:');
      console.log(`   Total users: ${await prisma.user.count()}`);
      console.log(`   Users with emails: ${usersWithEmails.length}`);
      console.log(`   Users without emails: ${await prisma.user.count() - usersWithEmails.length}`);
      
      console.log('\n🎯 Next Steps:');
      console.log('   1. Run: npx prisma migrate dev --name add_unique_email_constraint');
      console.log('   2. The migration will add unique constraint safely');
      
    } else {
      console.log(`❌ Found ${Object.keys(duplicates).length} duplicate email addresses:`);
      
      for (const [email, users] of Object.entries(duplicates)) {
        console.log(`\n📧 Email: ${email}`);
        console.log(`   Duplicate count: ${users.length}`);
        
        for (const user of users) {
          console.log(`   - User ID: ${user.id}`);
          console.log(`     Username: ${user.username}`);
          console.log(`     Created: ${user.createdAt.toISOString()}`);
        }
      }
      
      console.log('\n🔧 Resolution Required:');
      console.log('   1. Manually resolve duplicate emails');
      console.log('   2. Either update duplicate emails or set them to null');
      console.log('   3. Then run the migration');
      
      console.log('\n💡 Suggested SQL to fix (run in database):');
      for (const [email, users] of Object.entries(duplicates)) {
        // Keep the oldest user's email, set others to null
        const sortedUsers = users.sort((a, b) => a.createdAt - b.createdAt);
        const keepUser = sortedUsers[0];
        const duplicateUsers = sortedUsers.slice(1);
        
        console.log(`\n   -- Keep email for: ${keepUser.username} (${keepUser.id})`);
        for (const dupUser of duplicateUsers) {
          console.log(`   UPDATE "User" SET email = NULL WHERE id = '${dupUser.id}'; -- ${dupUser.username}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking duplicates:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDuplicateEmails();