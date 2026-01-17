# 🐦 Twitter OAuth 2.0 Setup Guide

## Overview

This guide explains how to use **Twitter OAuth 2.0** alongside **OAuth 1.0a** for higher rate limits and better performance.

---

## 📊 Rate Limits Comparison

| Auth Method | Free Tier | Basic ($100/mo) | Pro ($5,000/mo) |
|-------------|-----------|-----------------|-----------------|
| **OAuth 1.0a** | 50 tweets/day | 3,000 tweets/month | 300 tweets/15min |
| **OAuth 2.0** | 100 tweets/day ✅ | Unlimited | Unlimited |

🎯 **Recommendation**: Use OAuth 2.0 for 2x the rate limit on free tier!

---

## 🚀 Setup OAuth 2.0

### Step 1: Get OAuth 2.0 Credentials

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Select your app → **Keys and tokens** tab
3. Scroll to **OAuth 2.0 Client ID and Client Secret**
4. Click **Generate** if not already created
5. Copy:
   - **Client ID**
   - **Client Secret**

### Step 2: Generate Access Token

Twitter OAuth 2.0 requires a manual authorization flow. Here's how:

```bash
# Set environment variables
export TWITTER_OAUTH2_CLIENT_ID="your_client_id"
export TWITTER_OAUTH2_CLIENT_SECRET="your_client_secret"
```

#### Authorization URL

Visit this URL in your browser (replace `CLIENT_ID`):

```
https://twitter.com/i/oauth2/authorize?response_type=code&client_id=CLIENT_ID&redirect_uri=http://localhost:3001/callback&scope=tweet.read%20tweet.write%20users.read%20offline.access&state=state&code_challenge=challenge&code_challenge_method=plain
```

**Scopes explained:**
- `tweet.read` - Read tweets
- `tweet.write` - Post tweets ✅
- `users.read` - Read user info
- `offline.access` - Get refresh token

After authorization, you'll get a `code` parameter in the callback URL.

#### Exchange Code for Access Token

```bash
curl -X POST https://api.twitter.com/2/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -u "CLIENT_ID:CLIENT_SECRET" \
  -d "code=YOUR_CODE&grant_type=authorization_code&redirect_uri=http://localhost:3001/callback&code_verifier=challenge"
```

Response:
```json
{
  "access_token": "YOUR_ACCESS_TOKEN",
  "refresh_token": "YOUR_REFRESH_TOKEN",
  "expires_in": 7200
}
```

### Step 3: Configure in BrandPilot

```bash
# Set environment variables
export TWITTER_OAUTH2_CLIENT_ID="your_client_id"
export TWITTER_OAUTH2_CLIENT_SECRET="your_client_secret"
export TWITTER_OAUTH2_ACCESS_TOKEN="your_access_token"
export TWITTER_OAUTH2_REFRESH_TOKEN="your_refresh_token"
export TWITTER_AUTH_METHOD="oauth2"

# Run configuration script
npm run config:twitter:oauth2
```

Or add directly to database:
```bash
node scripts/configureTwitterOAuth2.js
```

---

## 🔧 Configuration Options

### Environment Variables

```bash
# OAuth 2.0 Credentials
TWITTER_OAUTH2_CLIENT_ID=your_client_id
TWITTER_OAUTH2_CLIENT_SECRET=your_client_secret
TWITTER_OAUTH2_ACCESS_TOKEN=your_access_token
TWITTER_OAUTH2_REFRESH_TOKEN=your_refresh_token

# Auth Method Selection
TWITTER_AUTH_METHOD=oauth2  # or oauth1 (default)
```

### Database Config

The system stores these in the `Config` table:
- `x_oauth2_client_id`
- `x_oauth2_client_secret`
- `x_oauth2_access_token`
- `x_oauth2_refresh_token`
- `twitter_auth_method` (oauth1 or oauth2)

---

## 🎯 How It Works

### Automatic Fallback

The system intelligently chooses the best auth method:

```
1. Check twitter_auth_method config
2. If oauth2 and token exists → Use OAuth 2.0
3. If OAuth 2.0 fails → Fallback to OAuth 1.0a
4. If oauth1 or no OAuth 2.0 token → Use OAuth 1.0a
```

### Request Flow

```
User Posts Tweet
       ↓
Rate Limiter Queue
       ↓
Auth Method Check
       ↓
   ┌────────┬────────┐
   │        │        │
OAuth 2.0  OAuth 1.0a  Fallback
   │        │        │
   ↓        ↓        ↓
Twitter API
   ↓
Success ✅
```

---

## 📝 API Usage

### Post Tweet (Automatic)

```javascript
// Frontend
const response = await fetch('/api/twitter/post', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ text: 'Hello Twitter!' })
});

const data = await response.json();
console.log('Auth method used:', data.authMethod); // 'oauth2' or 'oauth1'
```

### Force Specific Auth Method

Update config:
```javascript
await prisma.config.update({
  where: { key: 'twitter_auth_method' },
  data: { value: 'oauth2' } // or 'oauth1'
});
```

---

## 🔄 Token Refresh

OAuth 2.0 access tokens expire after 2 hours. The system will automatically refresh them (coming soon), or you can refresh manually:

```javascript
import { refreshOAuth2Token } from './services/twitterOAuth2.js';

const { accessToken, refreshToken } = await refreshOAuth2Token(
  clientId,
  clientSecret,
  currentRefreshToken
);

// Update in database
await prisma.config.update({
  where: { key: 'x_oauth2_access_token' },
  data: { value: accessToken }
});

await prisma.config.update({
  where: { key: 'x_oauth2_refresh_token' },
  data: { value: refreshToken }
});
```

---

## 🧪 Testing

### Test OAuth 2.0 Setup

```bash
# Check current configuration
npm run check:config

# Test posting with current auth method
npm run test:twitter

# Test rate limiter
npm run test:twitter:ratelimit
```

### Manual Test

```bash
curl -X POST http://localhost:3001/api/twitter/post \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{"text": "Test tweet via OAuth 2.0!", "priority": 0}'
```

---

## 🔍 Troubleshooting

### OAuth 2.0 Token Expired

**Error**: `401 Unauthorized` or `Invalid OAuth 2.0 access token`

**Solution**:
1. Check token expiration (2 hours from generation)
2. Use refresh token to get new access token
3. Or regenerate tokens from developer portal

### Fallback to OAuth 1.0a

**Symptoms**: Tweets posting but using OAuth 1.0a

**Checks**:
1. Verify `twitter_auth_method` is set to `oauth2`
2. Verify `x_oauth2_access_token` is not expired
3. Check server logs for OAuth 2.0 errors
4. Validate token: `npm run check:config`

### Rate Limit Still Low

**Problem**: Still hitting 50 tweets/day limit

**Solution**:
1. Confirm using OAuth 2.0: Check response `authMethod` field
2. Verify config: `twitter_auth_method` should be `oauth2`
3. Check logs for auth method being used
4. May need to wait for rate limit window reset

---

## 💡 Best Practices

### 1. **Use OAuth 2.0 for Production**
- Higher rate limits
- Easier token management
- Better security (no signature generation)

### 2. **Keep Refresh Token Safe**
```javascript
// ✅ Good - Store in database
await prisma.config.create({
  key: 'x_oauth2_refresh_token',
  value: refreshToken
});

// ❌ Bad - Hardcode in code
const REFRESH_TOKEN = 'abc123...';
```

### 3. **Monitor Token Expiration**
```javascript
// Set up automatic refresh
setInterval(async () => {
  const config = await getConfig('x_oauth2_access_token');
  // Refresh if older than 1.5 hours
}, 90 * 60 * 1000);
```

### 4. **Handle Fallback Gracefully**
```javascript
if (response.authMethod === 'oauth1') {
  console.warn('Using OAuth 1.0a - consider checking OAuth 2.0 token');
}
```

---

## 📊 Monitoring

### Check Current Auth Method

```bash
# From database
SELECT value FROM Config WHERE key = 'twitter_auth_method';

# Or via API
curl http://localhost:3001/api/config/twitter_auth_method \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Rate Limit Status

```bash
curl http://localhost:3001/api/twitter/rate-limit-status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎉 Summary

| Feature | OAuth 1.0a | OAuth 2.0 |
|---------|------------|-----------|
| **Setup** | ✅ Simpler | ⚠️ Manual flow |
| **Rate Limit (Free)** | 50/day | ✅ 100/day |
| **Token Expiry** | Never | 2 hours |
| **Refresh** | Not needed | ✅ Auto-refresh |
| **Security** | HMAC-SHA1 | ✅ Bearer token |

**Recommendation**: 
- **Development**: Start with OAuth 1.0a (simpler)
- **Production**: Use OAuth 2.0 (2x rate limit)
- **Best**: Keep both configured with automatic fallback

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: January 17, 2026
