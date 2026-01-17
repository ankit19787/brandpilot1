# 🐦 Twitter API Rate Limit Handler

## Overview

Comprehensive rate limiting solution for Twitter API to prevent quota exhaustion and handle "too many requests" (429) errors gracefully.

## ✨ Features

### 1. **Request Queue System**
- Automatically queues all Twitter API requests
- Priority-based processing (urgent tweets go first)
- FIFO (First In, First Out) for same-priority requests

### 2. **Smart Rate Limiting**
- **Self-imposed limit**: 50 requests per 15 minutes (conservative)
- **Twitter's actual limit**: ~300 tweets per 15 minutes (Free tier)
- Automatic window tracking and reset
- Prevents hitting Twitter's hard limits

### 3. **Exponential Backoff Retry**
- Automatic retry on failures: 1s → 2s → 5s → 10s
- Up to 4 retry attempts per request
- Intelligent error detection

### 4. **429 Error Handling**
- Detects rate limit errors from Twitter
- Parses `x-rate-limit-reset` header
- Automatically waits until reset time
- Re-queues failed requests

### 5. **Status Monitoring**
- Real-time queue length
- Requests made vs remaining
- Time until window reset
- Rate limit cooldown status

---

## 🚀 Usage

### Basic Tweet Posting

```javascript
// Frontend (React component)
const postTweet = async (text) => {
  const response = await fetch('/api/twitter/post', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ text })
  });
  
  const data = await response.json();
  
  if (response.status === 429) {
    console.log('Tweet queued:', data.queuePosition);
  } else {
    console.log('Tweet posted:', data);
  }
};
```

### Priority Tweets

```javascript
// High priority tweet (goes to front of queue)
const response = await fetch('/api/twitter/post', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ 
    text: 'URGENT: Breaking news!',
    priority: 10  // Higher = processed first
  })
});
```

### Check Rate Limit Status

```javascript
// Get current rate limit status
const response = await fetch('/api/twitter/rate-limit-status', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const status = await response.json();
console.log(status);
// {
//   queueLength: 3,
//   requestsMade: 12,
//   remainingRequests: 38,
//   windowResetsIn: 720,  // seconds
//   isRateLimited: false,
//   rateLimitResetsIn: null
// }
```

---

## 📊 Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| `201` | Tweet posted successfully | Continue normally |
| `429` | Rate limited, tweet queued | Wait for automatic processing |
| `400` | Bad request (missing text) | Fix request parameters |
| `401` | Unauthorized | Check authentication token |
| `500` | Server error | Check server logs |

---

## 🧪 Testing

### Test Rate Limiter

```bash
# Run comprehensive rate limit test
npm run test:twitter:ratelimit
```

This will:
1. Send 5 tweets rapidly
2. Test priority queue handling
3. Monitor queue processing
4. Display rate limit status

### Manual Testing

```bash
# Check current rate limit status
curl http://localhost:3001/api/twitter/rate-limit-status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Post a tweet
curl -X POST http://localhost:3001/api/twitter/post \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"text": "Test tweet", "priority": 0}'
```

---

## ⚙️ Configuration

### Adjust Rate Limits

Edit `services/twitterRateLimiter.js`:

```javascript
constructor() {
  // Change these values
  this.maxRequestsPerWindow = 50;  // Max requests per window
  this.windowDuration = 15 * 60 * 1000;  // 15 minutes
  this.retryDelays = [1000, 2000, 5000, 10000];  // Retry delays
}
```

### Twitter API Tiers

| Tier | Cost | Rate Limit |
|------|------|------------|
| **Free** | $0 | ~50 tweets/day |
| **Basic** | $100/mo | 3,000 tweets/month |
| **Pro** | $5,000/mo | 300 tweets/15min |
| **Enterprise** | Custom | Custom limits |

---

## 🔧 How It Works

### Request Flow

```
User Posts Tweet
       ↓
Rate Limiter Queue
       ↓
Check Rate Limit
       ↓
   ┌─────────┬─────────┐
   │         │         │
Within   Hit Limit   Error
Limit       ↓         ↓
   ↓     Wait &    Retry
Post    Re-queue  w/ Backoff
   ↓        ↓         ↓
Success  Success  Fail/Success
```

### Priority Queue Example

```javascript
Queue before processing:
[
  { text: "Normal tweet", priority: 0 },
  { text: "URGENT!", priority: 10 },      // ← Processed first
  { text: "Important", priority: 5 },     // ← Then this
  { text: "Another tweet", priority: 0 }
]
```

---

## 🚨 Error Handling

### 429 Rate Limit Error

```javascript
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Your tweet has been queued...",
  "rateLimitStatus": {
    "queueLength": 5,
    "requestsMade": 50,
    "remainingRequests": 0,
    "windowResetsIn": 420,
    "isRateLimited": true,
    "rateLimitResetsIn": 420
  },
  "queuePosition": 5
}
```

### Retry Logic

```javascript
Attempt 1 → Fail → Wait 1s  → Retry
Attempt 2 → Fail → Wait 2s  → Retry
Attempt 3 → Fail → Wait 5s  → Retry
Attempt 4 → Fail → Wait 10s → Retry
Attempt 5 → Fail → Give Up
```

---

## 💡 Best Practices

### 1. **Use Priority Wisely**
```javascript
// Normal tweets
priority: 0

// Important updates
priority: 5

// Urgent/breaking news
priority: 10
```

### 2. **Monitor Queue Status**
Display queue status to users:
```javascript
const status = await getRateLimitStatus();
if (status.queueLength > 0) {
  showNotification(`${status.queueLength} tweets in queue`);
}
```

### 3. **Handle 429 Gracefully**
```javascript
if (response.status === 429) {
  const data = await response.json();
  showNotification(
    `Tweet queued (position: ${data.queuePosition}). ` +
    `Will post when rate limit resets.`
  );
}
```

### 4. **Batch Scheduled Posts**
Spread scheduled posts over time to avoid bursts:
```javascript
const scheduleTime = baseTime + (index * 60000); // 1 minute apart
```

---

## 📈 Performance Metrics

### Before Rate Limiter
- ❌ 429 errors crash the app
- ❌ Failed tweets lost forever
- ❌ No retry mechanism
- ❌ Users don't know why it failed

### After Rate Limiter
- ✅ Automatic queue handling
- ✅ Failed tweets auto-retry
- ✅ Exponential backoff prevents spam
- ✅ Clear status messages
- ✅ Priority queue for urgent tweets

---

## 🔍 Troubleshooting

### Problem: Tweets not posting

**Check:**
1. Rate limit status: `GET /api/twitter/rate-limit-status`
2. Twitter credentials configured
3. Server logs for errors

### Problem: Queue not processing

**Solution:**
```javascript
// Clear rate limit (for testing only)
rateLimiter.clearRateLimit();
```

### Problem: Too many 429 errors

**Solutions:**
1. Reduce `maxRequestsPerWindow` (more conservative)
2. Increase `windowDuration`
3. Upgrade Twitter API tier
4. Spread out scheduled posts

---

## 🎯 Future Enhancements

1. **Redis Queue** - For multi-server setups
2. **WebSocket Updates** - Real-time queue status
3. **Analytics Dashboard** - Track rate limit usage
4. **Smart Scheduling** - Auto-optimize post times
5. **OAuth 2.0 Support** - For better rate limits

---

## 📚 Resources

- [Twitter API Rate Limits](https://developer.twitter.com/en/docs/twitter-api/rate-limits)
- [Twitter API Pricing](https://developer.twitter.com/en/portal/products)
- [Exponential Backoff](https://en.wikipedia.org/wiki/Exponential_backoff)

---

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Last Updated**: January 17, 2026
