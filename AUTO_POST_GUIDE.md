# Auto-Post System - Complete Guide with Authentication

## Current Status
✅ Auto-post setting: **ENABLED** in database  
✅ Server: Running on port 3001  
✅ Authentication: **Bearer token required** for all APIs
✅ Monitoring: Checks every 5 seconds for due posts  
✅ Database: Posts persist across refreshes

## How It Works

### Architecture
```
Frontend (React App) ←→ Backend (Node.js) ←→ Database (PostgreSQL)
     ↓                        ↓                    ↓
  Monitoring              API Endpoints        Stored Posts
  (every 5s)              /api/posts           status: scheduled
                          /api/config          scheduledFor: DateTime
                          (with Bearer token)  (authenticated)
```

### Auto-Post Flow with Authentication
1. **User logs in** → Gets Bearer token stored in localStorage
2. **User schedules a post** → Saved to database with `status: 'scheduled'` (authenticated request)
3. **React app loads** → Fetches `auto_post_enabled` config from database (with auth headers)
4. **useEffect monitoring starts** → Runs every 5 seconds (if enabled and authenticated)
5. **Each check:**
   - Fetches all scheduled posts from database (Bearer token required)
   - Filters posts where `scheduledFor <= now`
   - Publishes each due post (authenticated publish API)
   - Updates database: `status: 'published'`, `publishedAt: now()` (with auth headers)

## 🔐 Authentication Requirements

**ALL auto-post operations require authentication:**

- ✅ `GET /api/config/auto_post_enabled` - Get auto-post setting
- ✅ `PUT /api/config/auto_post_enabled` - Enable/disable auto-post
- ✅ `GET /api/posts` - Fetch scheduled posts
- ✅ `POST /api/publish` - Publish posts to platforms
- ✅ `PUT /api/posts/{id}` - Update post status

### Authentication Headers Required
```javascript
// All auto-post API calls include:
Authorization: Bearer {user_token}
Content-Type: application/json
```

## Important: Frontend-Only Monitoring

⚠️ **The auto-post monitoring runs in the React app, NOT on the server!**

This means:
- **App must be open** in a browser for auto-posting to work
- **User must be logged in** for authentication
- Closing the browser tab stops monitoring
- Refreshing the page restarts monitoring (token persists in localStorage)
- **Token expiration** (7 days) will stop auto-posting until re-login

### Why Frontend?
- Real-time UI updates with authentication context
- User sees toast notifications for authenticated actions
- Access to stored Bearer tokens in localStorage
- State management in React with user session

## Testing Auto-Post with Authentication

### Step 1: Verify Auto-Post is Enabled
```bash
node scripts/checkAutoPostConfig.js
```

If disabled, enable it:
```bash
node scripts/enableAutoPost.js
```

### Step 2: Login to Get Authentication Token
1. Open app: `http://localhost:5173`
2. Login with valid credentials (e.g., `ruchi` / `123456`)
3. Verify token is stored: Check browser localStorage for `brandpilot_auth`

### Step 3: Check Browser Console for Authentication
You should see:
```
[Agent] User authenticated, token available
[Agent] Auto-post setting loaded: true
[Agent] Auto-post monitoring enabled, checking every 5 seconds
```

If you see authentication errors:
```
[Agent] Failed to fetch auto-post config: 401 (Unauthorized)
```
This means you need to login or your token has expired.

### Step 4: Create a Test Post (Authenticated)
```bash
node scripts/testScheduledPost.js
```

This creates an authenticated post scheduled for 30 seconds from now.

### Step 5: Watch the Console (Authentication Flow)
Every 5 seconds you'll see:
```
[Agent] Checking for due posts... Current time: ...
[Agent] Fetching scheduled posts with authentication
[Agent] Total scheduled posts: 1
[Agent] Post abc123: scheduled for ..., due: false
```

When the post is due:
```
[Agent] Found 1 due posts, publishing...
[Agent] Auto-publishing due post: abc123 to X
[Agent] Publishing to X with authentication...
[Agent] ✅ Successfully published post abc123
```

### Step 6: Verify in Database
```bash
node scripts/checkPostStatus.js
```

Should show: `Status: published`

## Common Issues & Solutions

### Issue: "Auto-post is disabled"
**Solution:** Enable it via CLI
```bash
node scripts/enableAutoPost.js
```

Then refresh the browser.

### Issue: No posts showing in calendar
**Problem:** Posts aren't loading from database

**Check:**
```bash
# See all posts for a user
node -e "import('@prisma/client').then(({PrismaClient}) => { const p = new PrismaClient(); p.post.findMany({where: {userId: '3a4b6e64-f294-422b-92cc-2944e876c32c'}}).then(posts => { console.log(posts); p.\$disconnect(); }); })"
```

**Solution:** Make sure you're logged in and userId matches

### Issue: Posts not publishing
**Check browser console** for errors:
- Is auto-post enabled? Look for `[Agent] Auto-post monitoring enabled`
- Are posts being detected? Look for `[Agent] Total scheduled posts: X`
- Are they due? Check the `due: true/false` output

**Common causes:**
1. App not open in browser
2. Auto-post disabled
3. No posts scheduled
4. Post time hasn't arrived yet
5. API credentials missing (for X/Facebook/Instagram)

### Issue: "No user ID available"
**Problem:** Not logged in

**Solution:** Log in to the app first

## CLI Scripts Reference

### Monitoring & Status
```bash
# Check auto-post config
node scripts/checkAutoPostConfig.js

# Check specific post status
node scripts/checkPostStatus.js

# Monitor post for changes
node scripts/monitorAutoPost.js
```

### Configuration
```bash
# Enable auto-post
node scripts/enableAutoPost.js

# Check user plan
node scripts/checkUserPlan.js

# Check credentials
node scripts/checkTwitterConfig.js
```

### Testing
```bash
# Create test scheduled post (30s from now)
node scripts/testScheduledPost.js

# Test Twitter posting immediately
node scripts/testTwitterPost.js
```

## Database Schema

### Post Table
```prisma
model Post {
  id           String    @id
  userId       String
  platform     String    // 'X' | 'Facebook' | 'Instagram'
  content      String
  imageUrl     String?
  status       String    // 'scheduled' | 'published' | 'failed'
  scheduledFor DateTime?
  publishedAt  DateTime?
  createdAt    DateTime
  updatedAt    DateTime
}
```

### Config Table
```prisma
model Config {
  id        String   @id
  key       String   @unique
  value     String
  updatedAt DateTime
}
```

**Auto-post config:**
- Key: `auto_post_enabled`
- Value: `'true'` or `'false'` (string)

## API Endpoints

### Posts
- `GET /api/posts/:userId` - Get user's posts
- `POST /api/posts` - Create new post
- `PATCH /api/posts/:postId` - Update post status

### Config
- `GET /api/config/:key` - Get single config value
- `POST /api/config` - Save/update config
- `DELETE /api/config/:key` - Delete config

## Troubleshooting Checklist

When auto-post isn't working:

- [ ] Server running? (`Server running on port 3001`)
- [ ] App open in browser? (http://localhost:3000)
- [ ] Logged in? (Check userId in console)
- [ ] Auto-post enabled? (`node scripts/checkAutoPostConfig.js`)
- [ ] Browser console shows monitoring? (`[Agent] Auto-post monitoring enabled`)
- [ ] Posts exist in database? (Check with scripts)
- [ ] Posts are actually scheduled? (status = 'scheduled')
- [ ] Scheduled time has passed? (scheduledFor <= now)
- [ ] API credentials configured? (X, Facebook, Instagram)

## Next Steps

1. **Open the app** in your browser
2. **Check browser console** - should see monitoring logs
3. **Create a test post** - `node scripts/testScheduledPost.js`
4. **Wait 30 seconds** - watch browser console
5. **Verify** - Post should auto-publish

The system is now fully functional! The monitoring runs in the browser and all config is persisted in the database.
