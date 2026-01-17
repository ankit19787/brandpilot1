# Twitter Media Upload Guide

## Overview

BrandPilot OS now supports posting images/photos to Twitter alongside your tweets! This feature works with both OAuth 1.0a and OAuth 2.0 authentication methods.

## Features

✅ **Image Upload Support**: Attach images to your tweets  
✅ **Dual Auth**: Works with both OAuth 1.0a and OAuth 2.0  
✅ **Automatic Processing**: Images are downloaded and uploaded automatically  
✅ **Rate Limit Aware**: Respects Twitter's rate limits  
✅ **Credit Refund**: Credits refunded if upload fails  

## How It Works

### Backend Implementation

#### 1. **OAuth 2.0 Media Upload** (`services/twitterOAuth2.js`)
```javascript
// Upload media using Bearer token
const mediaId = await uploadMediaOAuth2(accessToken, imageBuffer);

// Post tweet with media
await postTweetOAuth2(accessToken, text, mediaUrl);
```

#### 2. **OAuth 1.0a Media Upload** (`server.js`)
```javascript
// Upload to upload.twitter.com/1.1/media/upload.json
// Get media_id_string
// Attach to tweet via media.media_ids array
```

### Frontend Integration

#### ContentEngine.tsx
```tsx
// Image is automatically passed via metadata
await platformAPI.publish(
  'X (Twitter)',
  content,
  statusCallback,
  { 
    imageUrl: generatedImageUrl,  // AI-generated image
    userId 
  }
);
```

## API Endpoints

### POST `/api/twitter/post`
Post a tweet with optional media.

**Request Body:**
```json
{
  "text": "Your tweet text here",
  "media": "https://example.com/image.jpg",  // Optional
  "priority": 0
}
```

**Response (Success):**
```json
{
  "data": {
    "id": "1234567890",
    "text": "Your tweet text here"
  },
  "authMethod": "oauth2"
}
```

### POST `/api/publish`
Universal publishing endpoint (supports media).

**Request Body:**
```json
{
  "platform": "X (Twitter)",
  "content": "Your tweet text",
  "metadata": {
    "userId": "user-uuid",
    "imageUrl": "https://example.com/image.jpg"  // Optional
  }
}
```

## Media Upload Process

### Step-by-Step Flow:

1. **Frontend**: User generates or provides an image
2. **API Call**: Image URL passed in `metadata.imageUrl`
3. **Backend**: Downloads image from URL
4. **Upload**: Posts to `https://upload.twitter.com/1.1/media/upload.json`
5. **Get Media ID**: Twitter returns `media_id_string`
6. **Post Tweet**: Creates tweet with `media.media_ids` array
7. **Response**: Returns tweet ID and URL

### OAuth 2.0 Flow:
```
Client → /api/publish → twitterRateLimiter → postTweetOAuth2
         ↓
         downloadImage(url) → imageBuffer
         ↓
         uploadMediaOAuth2(token, buffer) → media_id
         ↓
         POST /2/tweets with { text, media: { media_ids: [media_id] } }
```

### OAuth 1.0a Flow:
```
Client → /api/publish → twitterRateLimiter → OAuth1 Handler
         ↓
         downloadImage(url) → imageBuffer
         ↓
         Generate OAuth signature
         ↓
         POST upload.twitter.com/1.1/media/upload.json → media_id
         ↓
         POST /2/tweets with { text, media: { media_ids: [media_id] } }
```

## Image Requirements

### Supported Formats:
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

### Size Limits:
- **Photos**: Max 5MB
- **Animated GIFs**: Max 15MB
- **Videos**: Not currently supported (photos only)

### Dimensions:
- Minimum: 600x600px recommended
- Maximum: 8192x8192px
- Aspect ratio: 1:1 to 2:1 recommended

## Testing

### Test with Script:
```bash
node scripts/testTwitterWithMedia.js
```

This will:
1. Download a test image
2. Post to Twitter with the image
3. Display the tweet URL and media ID

### Test via UI:
1. Open Content Engine
2. Generate or provide an image
3. Add your tweet text
4. Click "Publish Now" with Twitter selected
5. Image will be uploaded automatically

## Error Handling

### Common Errors:

#### Media Upload Failed
```json
{
  "error": "Media upload failed: Invalid image format"
}
```
**Solution**: Ensure image URL is accessible and in a supported format

#### Rate Limit Exceeded
```json
{
  "error": "Rate limit exceeded",
  "message": "You've reached your Twitter posting limit (17 posts per 24 hours)..."
}
```
**Solution**: Wait for rate limit reset (shown in error message)

#### Image Too Large
```json
{
  "error": "Media upload failed: File size too large"
}
```
**Solution**: Compress image or use smaller file

## Credits System

### Credit Costs:
- **Text-only tweet**: 30 credits
- **Tweet with image**: 30 credits (same cost)
- **Image generation**: 40 credits (separate)

### Credit Refund:
If media upload fails, the 30 credits are automatically refunded.

## Rate Limits

### Twitter Free Tier:
- **17 tweets per 24 hours** (with or without media)
- Rate limit applies to both OAuth 1.0a and 2.0

### Media Upload Limits:
- Shares the same rate limit as posting
- Each media upload counts as an API call

## Best Practices

1. **Image Optimization**: Compress images before uploading to reduce upload time
2. **Error Handling**: Always check for media upload errors
3. **Alt Text**: Consider adding alt text for accessibility (future feature)
4. **Aspect Ratio**: Use 16:9 or 1:1 for best display
5. **File Size**: Keep images under 2MB for faster uploads

## Troubleshooting

### Image Not Showing
- Check if image URL is publicly accessible
- Verify image format is supported
- Check server logs for upload errors

### Upload Timeout
- Image might be too large
- Network connectivity issues
- Try with a smaller image

### OAuth Errors
- Ensure Twitter credentials are configured
- Check if tokens are still valid
- Verify OAuth method is set correctly

## Future Enhancements

🔜 **Coming Soon**:
- Multiple images (up to 4 per tweet)
- Video upload support
- GIF upload support
- Alt text for accessibility
- Image preview before posting
- Direct file upload (vs URL)

## Code Examples

### JavaScript (Node.js)
```javascript
import fetch from 'node-fetch';

const response = await fetch('http://localhost:3001/api/twitter/post', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Check out this image! 📸',
    media: 'https://example.com/my-image.jpg'
  })
});

const data = await response.json();
console.log('Tweet posted:', data.data.id);
```

### TypeScript (Frontend)
```typescript
await publishToPlatform(
  'X (Twitter)',
  'Amazing content! 🚀',
  {
    imageUrl: generatedImageUrl,
    userId: currentUser.id
  }
);
```

## API Reference

### `uploadMediaOAuth2(accessToken, imageBuffer)`
Uploads media using OAuth 2.0.

**Parameters:**
- `accessToken` (string): OAuth 2.0 Bearer token
- `imageBuffer` (Buffer): Image data

**Returns:**
- `media_id_string` (string): Twitter media ID

### `postTweetOAuth2(accessToken, text, media?)`
Posts tweet with optional media using OAuth 2.0.

**Parameters:**
- `accessToken` (string): OAuth 2.0 Bearer token
- `text` (string): Tweet text
- `media` (string | Buffer, optional): Image URL or Buffer

**Returns:**
- Tweet response object with `data.id`

## Related Documentation

- [Twitter OAuth 2.0 Guide](TWITTER_OAUTH2_GUIDE.md)
- [Twitter Rate Limit Guide](TWITTER_RATE_LIMIT_GUIDE.md)
- [Authentication Guide](AUTHENTICATION_GUIDE.md)
- [Credits System](CREDITS_SYSTEM_README.md)

## Support

Need help? Check:
1. Server logs: `console.log` output when server is running
2. Error messages: Detailed error info in API responses
3. Rate limit status: GET `/api/twitter/rate-limit-status`
4. Test script: `node scripts/testTwitterWithMedia.js`

---

**Last Updated**: January 17, 2026  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
