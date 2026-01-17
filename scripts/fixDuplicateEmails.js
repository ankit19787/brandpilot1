/**
 * Fix duplicate email addresses by setting duplicates to null
 * Keeps the oldest user's email address
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDuplicateEmails() {
  console.log('🔧 Fixing duplicate email addresses...');
  
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
    
    // Group by email to find duplicates
    const emailGroups = {};
    for (const user of usersWithEmails) {
      const email = user.email.toLowerCase();
      if (!emailGroups[email]) {
        emailGroups[email] = [];
      }
      emailGroups[email].push(user);
    }
    
    // Find and fix duplicates
    let fixedCount = 0;
    for (const [email, users] of Object.entries(emailGroups)) {
      if (users.length > 1) {
        console.log(`\n📧 Processing duplicates for: ${email}`);
        
        // Sort by creation date (oldest first)
        const sortedUsers = users.sort((a, b) => a.createdAt - b.createdAt);
        const keepUser = sortedUsers[0];
        const duplicateUsers = sortedUsers.slice(1);
        
        console.log(`✅ Keeping email for: ${keepUser.username} (created ${keepUser.createdAt.toISOString()})`);
        
        // Set email to null for duplicate users
        for (const dupUser of duplicateUsers) {
          console.log(`❌ Removing email from: ${dupUser.username} (${dupUser.id})`);
          
          await prisma.user.update({
            where: { id: dupUser.id },
            data: { email: null }
          });
          
          fixedCount++;
        }
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ DUPLICATE EMAIL CLEANUP COMPLETED!');
    console.log('=' .repeat(50));
    
    if (fixedCount === 0) {
      console.log('ℹ️  No duplicates found to fix');
    } else {
      console.log(`🔧 Fixed ${fixedCount} duplicate email addresses`);
    }
    
    // Verify cleanup
    const remainingUsersWithEmails = await prisma.user.findMany({
      where: {
        email: {
          not: null
        }
      },
      select: {
        id: true,
        username: true,
        email: true
      }
    });
    
    // Check for remaining duplicates
    const remainingEmailGroups = {};
    for (const user of remainingUsersWithEmails) {
      const email = user.email.toLowerCase();
      if (!remainingEmailGroups[email]) {
        remainingEmailGroups[email] = [];
      }
      remainingEmailGroups[email].push(user);
    }
    
    const remainingDuplicates = Object.entries(remainingEmailGroups).filter(([email, users]) => users.length > 1);
    
    console.log('\n📊 Final Status:');
    console.log(`   Users with emails: ${remainingUsersWithEmails.length}`);
    console.log(`   Remaining duplicates: ${remainingDuplicates.length}`);
    
    if (remainingDuplicates.length === 0) {
      console.log('\n🎉 All email duplicates resolved!');
      console.log('✅ Ready to add unique constraint');
      console.log('\n🎯 Next step: npx prisma migrate dev --name add_unique_email_constraint');
    } else {
      console.log('\n⚠️  Still have duplicates - manual intervention required');
    }
    
  } catch (error) {
    console.error('❌ Error fixing duplicates:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixDuplicateEmails();