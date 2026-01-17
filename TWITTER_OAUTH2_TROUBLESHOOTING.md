# 🐦 Twitter OAuth 2.0 Troubleshooting Guide

## Common Error: "Something went wrong - You weren't able to give access to the App"

This error occurs when the OAuth 2.0 configuration doesn't match between your app and Twitter Developer Portal.

---

## ✅ Step 1: Verify Twitter Developer Portal Settings

### 1.1 Go to Twitter Developer Portal
1. Visit: https://developer.twitter.com/en/portal/dashboard
2. Click on your App (the one with Client ID: `Y3F6TUtSMUh6X3JGaGRkdllPZ1c6MTpjaQ`)

### 1.2 Check OAuth 2.0 Settings
1. Click on **"App settings"** → **"Settings"**
2. Scroll to **"User authentication settings"**
3. Click **"Set up"** or **"Edit"** if already configured

### 1.3 Required Settings:

**App permissions:**
- ✅ Read and write (required for posting tweets)

**Type of App:**
- ✅ Web App, Automated App or Bot

**App info:**
- **Callback URI / Redirect URL:**
  ```
  http://localhost:3001/api/twitter/oauth2/callback
  ```
  ⚠️ **CRITICAL**: This MUST match exactly (no trailing slash!)

- **Website URL:** (can be anything, e.g., `https://brandpilot.app`)

**OAuth 2.0 Settings:**
- ✅ Enable OAuth 2.0
- Request email from users: Optional
- OAuth 2.0 scopes:
  - ✅ `tweet.read`
  - ✅ `tweet.write`
  - ✅ `users.read`
  - ✅ `offline.access` (for refresh tokens)

### 1.4 Save Settings
- Click **"Save"** at the bottom
- Twitter will show your **Client ID** and **Client Secret**
- Verify Client ID matches: `Y3F6TUtSMUh6X3JGaGRkdllPZ1c6MTpjaQ`

---

## ✅ Step 2: Verify Server is Running

The OAuth callback endpoint needs the server to be running.

### 2.1 Check if Server is Running:
```powershell
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
```

**Expected output:** Should show port 3001 in LISTEN state

### 2.2 If Not Running, Start Server:
```powershell
# Stop any existing node processes
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Start server
node server.js
```

**Expected output:**
```
✅ Server running on http://localhost:3001
✅ Database connected
```

---

## ✅ Step 3: Retry Authorization Flow

### 3.1 Generate Fresh Authorization URL:
```powershell
node scripts/getTwitterAuthUrl.js
```

### 3.2 Open URL in Browser:
- Copy the entire URL
- Paste into your browser
- **Make sure you're logged into Twitter** in that browser

### 3.3 Authorize the App:
- Click **"Authorize app"**
- You should be redirected to `http://localhost:3001/api/twitter/oauth2/callback?code=...`
- The page will display your authorization code

### 3.4 Exchange Code for Token:
```powershell
# Copy the code from the browser and run:
node scripts/getTwitterOAuth2Token.js <your-code-here>
```

⚠️ **Important:** The code expires in 30 seconds!

---

## 🔍 Common Issues & Solutions

### Issue 1: "Callback URL not approved for this client application"

**Cause:** The redirect URI doesn't match Twitter Developer Portal settings

**Solution:**
1. Go to Twitter Developer Portal → App Settings → User Authentication Settings
2. Add EXACTLY: `http://localhost:3001/api/twitter/oauth2/callback`
3. Save and try again

### Issue 2: "Invalid redirect_uri parameter"

**Cause:** Mismatch between script and Twitter settings

**Solution:**
Check `scripts/getTwitterAuthUrl.js` line 7:
```javascript
const REDIRECT_URI = 'http://localhost:3001/api/twitter/oauth2/callback';
```
This MUST match Twitter Developer Portal settings exactly.

### Issue 3: "You weren't able to give access to the App"

**Causes:**
1. App not properly configured in Twitter Developer Portal
2. Wrong OAuth 2.0 Client ID
3. Missing required scopes
4. Server not running on port 3001

**Solution:**
1. Verify all settings in Twitter Developer Portal (see Step 1)
2. Ensure server is running: `node server.js`
3. Check Client ID matches in both places
4. Try with fresh authorization URL

### Issue 4: "Authorization code expired"

**Cause:** Code was used after 30 seconds

**Solution:**
1. Generate new authorization URL
2. Authorize app again
3. Copy code and exchange IMMEDIATELY (within 30 seconds)

### Issue 5: "Server not responding"

**Cause:** Node server not running or crashed

**Solution:**
```powershell
# Check server status
Get-Process -Name node -ErrorAction SilentlyContinue

# Restart server
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
node server.js
```

---

## 🧪 Testing Your Setup

### Test 1: Verify Server Endpoint
```powershell
# Should return HTML page (not 404)
Invoke-WebRequest -Uri "http://localhost:3001/api/twitter/oauth2/callback?code=test" -UseBasicParsing | Select-Object StatusCode
```
**Expected:** StatusCode: 200

### Test 2: Check Configuration
```powershell
node scripts/checkTwitterConfig.js
```
**Expected:** Shows OAuth 2.0 Client ID and Secret

### Test 3: Verify OAuth 2.0 Token (after authorization)
```powershell
npm run test:twitter:oauth2
```
**Expected:** Successfully posts tweet using OAuth 2.0

---

## 📋 Complete Authorization Checklist

Before trying again, verify ALL of these:

- [ ] Server is running on port 3001
- [ ] Twitter Developer Portal has correct redirect URI: `http://localhost:3001/api/twitter/oauth2/callback`
- [ ] App has "Read and write" permissions
- [ ] OAuth 2.0 is enabled in Twitter Developer Portal
- [ ] Required scopes are selected (tweet.read, tweet.write, users.read, offline.access)
- [ ] Client ID matches: `Y3F6TUtSMUh6X3JGaGRkdllPZ1c6MTpjaQ`
- [ ] You are logged into Twitter in your browser
- [ ] Authorization URL is freshly generated (not using old URL)
- [ ] Code is exchanged within 30 seconds of receiving it

---

## 🆘 Still Having Issues?

### Check Detailed Logs:

1. **Server logs** - Look at terminal running `node server.js`
2. **Browser console** - Press F12 and check for errors
3. **Twitter API errors** - Check response in Network tab

### Alternative: Manual Token Exchange

If automatic flow doesn't work, you can manually exchange the code:

```powershell
# 1. Get authorization code from browser URL after authorization
# URL will be: http://localhost:3001/api/twitter/oauth2/callback?code=ABC123...

# 2. Immediately run:
node scripts/getTwitterOAuth2Token.js ABC123...
```

### Last Resort: Use OAuth 1.0a

If OAuth 2.0 continues to fail, the system will automatically fallback to OAuth 1.0a:

```powershell
# Set auth method back to OAuth 1.0a
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.config.upsert({ where: { key: 'twitter_auth_method' }, update: { value: 'oauth1' }, create: { key: 'twitter_auth_method', value: 'oauth1' } }).then(() => { console.log('Set to OAuth 1.0a'); prisma.$disconnect(); });"
```

This will use the existing OAuth 1.0a credentials (50 tweets/day limit instead of 100).

---

## 📞 Support

If you've tried everything and it's still not working:

1. Take screenshots of:
   - Twitter Developer Portal settings
   - Authorization error message
   - Server terminal output
   
2. Check server.js has the callback endpoint:
   ```javascript
   app.get('/api/twitter/oauth2/callback', async (req, res) => {
   ```

3. Verify redirect URI matches EXACTLY in:
   - `scripts/getTwitterAuthUrl.js` (line 7)
   - Twitter Developer Portal
   - Should be: `http://localhost:3001/api/twitter/oauth2/callback`

---

**Last Updated:** January 17, 2026
**OAuth 2.0 Rate Limit:** 100 tweets/day (Free tier)
**Fallback:** OAuth 1.0a (50 tweets/day)
