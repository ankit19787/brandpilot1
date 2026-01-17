// Simple guide for checking login status

console.log(`
╔════════════════════════════════════════════════════════════╗
║        EMAIL NOTIFICATION TROUBLESHOOTING GUIDE            ║
╚════════════════════════════════════════════════════════════╝

📧 EMAIL NOTIFICATION REQUIREMENTS:

1. User MUST have email address set in profile
   ✅ Admin has email: ankit19787@gmail.com
   ❌ testuser, demo1, demo2 have NO email

2. You MUST be logged in as a user with email
   → Check top-right corner of UI for username
   → Should show "admin" not "demo1" or "testuser"

3. Posts must change to "published" or "failed" status
   → Emails sent automatically on status change

═══════════════════════════════════════════════════════════════

🔧 HOW TO FIX:

If emails are not arriving:

1. CHECK WHO YOU'RE LOGGED IN AS:
   Look at the UI header → Should show "admin"
   
2. IF LOGGED IN AS DEMO USER:
   → Logout
   → Login as: admin / BrandPilot2025!
   
3. ADD EMAIL TO OTHER USERS:
   → Go to Profile Settings
   → Add email address
   → Save

4. VERIFY SERVER IS RUNNING:
   → Open new terminal
   → Run: node server.js
   → Look for "✅ Email service initialized successfully"

═══════════════════════════════════════════════════════════════

📝 QUICK TEST:

1. Make sure server is running: node server.js
2. Login as admin in the UI
3. Create a post and publish it
4. Check server console for:
   "📧 Attempting to send email to: ankit19787@gmail.com"
   "✅ Email sent"

5. Check your inbox: ankit19787@gmail.com

═══════════════════════════════════════════════════════════════

🐛 STILL NOT WORKING?

Run this command to test:
  node scripts/testPostEmailNotification.js

Then check the server terminal for detailed logs.

═══════════════════════════════════════════════════════════════
`);
