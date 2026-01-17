# 🔐 BrandPilot OS - Authentication Guide

## Overview

BrandPilot OS implements a comprehensive Bearer token authentication system that secures all API endpoints and frontend components. This guide covers the complete authentication implementation, troubleshooting, and best practices.

---

## 🏗️ Authentication Architecture

### Backend Authentication
- **Token-based Authentication**: Uses Bearer tokens with 7-day expiration
- **Session Management**: Database-stored sessions with automatic cleanup
- **Password Security**: SHA-256 password hashing
- **Middleware Protection**: All protected endpoints use `authenticateToken` middleware
- **Role-based Access**: Admin and user role separation

### Frontend Authentication  
- **Automatic Token Management**: Tokens stored in localStorage
- **Session Restoration**: Automatic login restoration on page reload
- **Universal Headers**: All API calls include proper Authorization headers
- **Component Protection**: Authentication-aware UI components

---

## 🔑 Authentication Flow

### 1. User Login Process
```javascript
// POST /api/login
{
  "username": "your_username",
  "password": "your_password"
}

// Response includes session data
{
  "token": "abc123...",
  "role": "user|admin",
  "userId": "uuid",
  "username": "your_username", 
  "plan": "free|pro|business|enterprise",
  "credits": 5000,
  "maxCredits": 10000,
  "avatarStyle": "6366f1"
}
```

### 2. Token Storage & Usage
- **Storage**: `localStorage.setItem('brandpilot_auth', JSON.stringify(authData))`
- **Header Format**: `Authorization: Bearer {token}`
- **Automatic Inclusion**: All API calls include authentication headers

### 3. Session Validation
- **Token Validation**: `POST /api/validate-token` 
- **Session Expiry**: 7 days from login
- **Auto-refresh**: Session restored on page load

---

## 🛡️ Protected Endpoints

### Authentication Required (Bearer Token)

#### Core Authentication
- `GET /api/me` - Get current user info
- `POST /api/validate-token` - Validate session token
- `POST /api/logout` - End user session

#### User Management
- `GET /api/users` - List all users (Admin only)
- `POST /api/users` - Create new user (Admin only)  
- `PATCH /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)
- `GET /api/user/stats/:userId` - Get user statistics
- `PATCH /api/user/profile/:userId` - Update user profile
- `GET /api/user/:userId/credits` - Get user credits
- `GET /api/user/:userId/credit-history` - Get credit history

#### Content & AI Features
- `POST /api/brand-dna` - Generate Brand DNA analysis (Pro+)
- `GET /api/brand-dna/:userId` - Get user's Brand DNA
- `POST /api/content-strategy` - Generate content strategy (Pro+)
- `GET /api/content-strategy/:userId` - Get user's content strategy
- `POST /api/monetization-plan` - Generate monetization plan (Pro+)
- `GET /api/monetization-plan/:userId` - Get user's monetization plan
- `POST /api/generate-post` - Generate social media post
- `POST /api/generate-image` - Generate images with AI
- `POST /api/publish` - Publish to social platforms
- `GET /api/posts/all` - Get all posts
- `POST /api/posts` - Create scheduled post
- `PATCH /api/posts/:id` - Update post status
- `DELETE /api/posts/:id` - Delete post

#### Configuration & Settings
- `GET /api/config` - Get system configuration
- `POST /api/config` - Update configuration
- `GET /api/config/:key` - Get specific config value
- `DELETE /api/config/:key` - Delete config setting
- `GET /api/stats` - Get API statistics

#### Analytics & Performance  
- `GET /api/analytics/:userId` - Get user analytics
- `GET /api/email-logs` - Get email logs (Admin only)

#### Payment & Monetization
- `POST /api/payment/checkout` - Create payment checkout
- `POST /api/payment/verify/:id` - Verify payment
- `GET /api/payment/history` - Get payment history

### Public Endpoints (No Authentication)
- `POST /api/login` - User login
- `GET /api/test-connection` - Test server connectivity

---

## 🔧 Frontend Implementation

### Authentication Header Helper
```typescript
const getAuthHeaders = () => {
  const authData = JSON.parse(localStorage.getItem('brandpilot_auth') || '{}');
  return {
    'Content-Type': 'application/json',
    ...(authData.token ? { 'Authorization': `Bearer ${authData.token}` } : {})
  };
};
```

### API Call Pattern
```typescript
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: getAuthHeaders(),
  body: JSON.stringify(data)
});
```

### Components with Authentication
All components now include proper authentication:

- ✅ **App.tsx** - Main application authentication logic
- ✅ **AdminPosts.tsx** - Admin post management
- ✅ **Dashboard.tsx** - User dashboard
- ✅ **BrandDNA.tsx** - Brand DNA analysis
- ✅ **ContentStrategist.tsx** - Content strategy generation  
- ✅ **Monetization.tsx** - Monetization planning
- ✅ **Profile.tsx** - User profile management
- ✅ **Connections.tsx** - Platform connections
- ✅ **Credentials.tsx** - API credentials management
- ✅ **EmailLogs.tsx** - Email log viewing
- ✅ **ManageUsers.tsx** - User management (Admin)
- ✅ **PaymentHistory.tsx** - Payment transactions
- ✅ **PlatformResponses.tsx** - Platform response monitoring
- ✅ **PerformanceBrain.tsx** - Analytics dashboard
- ✅ **PlanModal.tsx** - Subscription management
- ✅ **APIConnectionTest.tsx** - API connectivity testing

### Services Layer Authentication
All service functions include authentication:

- ✅ **gemini.client.ts** - AI service calls
  - `analyzeBrandDNA()`
  - `generateContentStrategy()`
  - `createPost()`
  - `getUserPosts()`
  - `createLog()`
  - `generatePost()`
  - `generateImage()`
  - `publishToPlatform()`
  - `getMonetizationPlan()`

---

## 🚨 Troubleshooting Authentication Issues

### Common Error Messages

#### "Access token required"
**Cause**: API call missing Authorization header
**Solution**: Ensure all fetch calls include authentication headers

```typescript
// ❌ Wrong - Missing authentication
fetch('/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

// ✅ Correct - Includes authentication  
fetch('/api/endpoint', {
  method: 'POST',
  headers: getAuthHeaders(),
  body: JSON.stringify(data)
});
```

#### "Unauthorized" (401 Error)
**Causes**:
- Expired or invalid token
- Missing token in localStorage
- Token not properly formatted

**Solutions**:
1. Check localStorage for `brandpilot_auth`
2. Verify token format: `Bearer {token}`
3. Re-login to get fresh token

#### "Invalid or expired token"
**Cause**: Session expired (>7 days) or token corrupted
**Solution**: Clear localStorage and re-login

```javascript
// Clear authentication and reload
localStorage.removeItem('brandpilot_auth');
window.location.reload();
```

### Frontend Authentication Debugging

#### Check Authentication State
```javascript
// In browser console
const authData = JSON.parse(localStorage.getItem('brandpilot_auth') || '{}');
console.log('Auth Data:', authData);
console.log('Has Token:', !!authData.token);
console.log('User ID:', authData.userId);
console.log('Role:', authData.role);
```

#### Test API Call with Authentication
```javascript
// Test authenticated API call
const authData = JSON.parse(localStorage.getItem('brandpilot_auth') || '{}');
fetch('/api/me', {
  headers: { 'Authorization': `Bearer ${authData.token}` }
})
.then(r => r.json())
.then(console.log);
```

#### Validate Session
```javascript
// Check if session is valid
const authData = JSON.parse(localStorage.getItem('brandpilot_auth') || '{}');
fetch('/api/validate-token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authData.token}`
  }
})
.then(r => r.json())
.then(result => console.log('Session Valid:', result));
```

---

## 🔒 Security Best Practices

### Token Security
- **Limited Lifespan**: 7-day expiration prevents long-term exposure
- **Secure Storage**: localStorage with JSON serialization
- **No URL Parameters**: Tokens never passed in URLs
- **HTTPS Only**: Use HTTPS in production for token transmission

### Password Security  
- **SHA-256 Hashing**: All passwords hashed before storage
- **No Plaintext**: Passwords never stored in plaintext
- **Secure Transmission**: Passwords only sent over HTTPS

### Session Management
- **Database Sessions**: Server-side session storage
- **Automatic Cleanup**: Expired sessions removed automatically
- **Logout Cleanup**: Sessions deleted on logout
- **Single Token**: One active session per user

### Development vs Production
```javascript
// Development (localhost)
const API_PREFIX = 'http://localhost:3001/api';

// Production (should use HTTPS)
const API_PREFIX = 'https://your-domain.com/api';
```

---

## 🚀 Quick Setup Guide

### 1. Database Setup
Ensure these tables exist:
- `users` - User accounts with password hashes
- `sessions` - Active authentication sessions

### 2. Environment Variables
```bash
# .env or .env.local
GEMINI_API_KEY=your_gemini_api_key
# Add other required environment variables
```

### 3. Test Authentication
```bash
# Start server
node server.js

# Test login (in another terminal)
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

### 4. Verify Frontend Authentication
1. Open browser to http://localhost:5173
2. Login with test credentials
3. Check localStorage for authentication data
4. Verify API calls include Authorization headers

---

## 📝 Implementation Checklist

### ✅ Backend (Complete)
- [x] Authentication middleware (`authenticateToken`)
- [x] Admin middleware (`requireAdmin`) 
- [x] Session management with database
- [x] Password hashing (SHA-256)
- [x] All endpoints properly protected
- [x] Error handling for authentication failures

### ✅ Frontend (Complete)
- [x] Authentication helper functions
- [x] All components include auth headers
- [x] Services layer authentication
- [x] Session restoration on page load
- [x] Automatic token management
- [x] Authentication-aware UI components

### ✅ Testing & Validation (Complete)
- [x] All endpoints tested with authentication
- [x] Frontend components verified
- [x] Error handling tested
- [x] Session expiry handling

---

## 📞 Support & Additional Resources

### Related Documentation
- [SWAGGER_API_DOCS.md](SWAGGER_API_DOCS.md) - Interactive API testing
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Database structure
- [README.md](README.md) - Project setup guide

### For Authentication Issues
1. Check this guide first
2. Review browser console for errors
3. Test with Swagger UI at `http://localhost:3001/api-docs`
4. Verify database sessions are being created

---

*Last Updated: January 17, 2026 - Complete authentication implementation with full frontend/backend coverage*