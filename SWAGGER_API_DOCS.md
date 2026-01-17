# BrandPilot OS - API Documentation (Swagger)

## 🚀 Interactive API Documentation

BrandPilot OS includes **complete Swagger/OpenAPI documentation** with interactive testing capabilities and **full Bearer token authentication**!

## Access Swagger UI

**Local Development:**
```
http://localhost:3001/api-docs
```

**Production:**
```
https://your-domain.com/api-docs
```

**OpenAPI JSON Spec:**
```
http://localhost:3001/api-docs.json
```

---

## 🔐 Authentication Required

**ALL API endpoints require Bearer token authentication** except:
- `POST /api/login` - User login
- `GET /api/test-connection` - Server connectivity test

### Authentication Headers
```javascript
Authorization: Bearer {your_token_here}
Content-Type: application/json
```

---

## Features

### ✨ Interactive Testing
- **Try It Out** - Test any endpoint directly from the browser
- **Live Request/Response** - See actual API responses in real-time
- **Parameter Validation** - Automatic validation of request parameters
- **Bearer Token Authentication** - Built-in authentication with secure tokens
- **Role-based Testing** - Test both User and Admin endpoints

### 📚 Complete Documentation
- **12 API Categories** - Authentication, Users, Posts, AI, Payment, and more
- **40+ Endpoints** - Full coverage of all platform APIs with authentication
- **Request Schemas** - Detailed parameter descriptions with examples
- **Response Schemas** - Expected response formats with status codes
- **Error Handling** - Common error responses documented
- **Authentication Examples** - Bearer token usage patterns

### 🎨 User-Friendly Interface
- **Search & Filter** - Quickly find specific endpoints
- **Categorized Tags** - Organized by functional area
- **Expandable Sections** - Clean, organized layout
- **Code Examples** - Request/response examples with authentication
- **Security Indicators** - Clear indication of protected endpoints

---

## Quick Start

### 1. Start the Server
```bash
node server.js
```
Server starts on port 3001 with Swagger enabled.

### 2. Open Swagger UI
Navigate to: `http://localhost:3001/api-docs`

### 3. Get Your Bearer Token

**Option A: Login with existing account**

1. Expand `POST /api/login` endpoint
2. Click **"Try it out"**
3. Enter your credentials:
   ```json
   {
     "username": "ruchi",
     "password": "123456"
   }
   ```
4. Click **"Execute"**
5. Copy the `token` value from the response

**Option B: Use test credentials**
```json
{
  "username": "ruchi",
  "password": "123456"
}
```
OR
```json
{
  "username": "ankit", 
  "password": "123456"
}
```

### 4. Authorize Swagger UI
1. Click the **"Authorize"** button (top right with green lock icon)
2. Paste your token (just the token value, NOT "Bearer ...")
3. Click **"Authorize"** then **"Close"**

Your token will now be automatically included in all requests!

### 5. Test an Endpoint
1. Expand any endpoint (e.g., `GET /api/me`)
2. Click **"Try it out"**
3. Fill in required parameters
4. Click **"Execute"**
5. View the response below

---

## API Categories

### 🔐 Authentication
- `POST /api/login` - **Login** - Get Bearer token for authentication
- `POST /api/logout` - Logout and invalidate token
- `GET /api/me` - Get current authenticated user info
- `POST /api/validate-token` - Validate JWT token

### 👥 Users
- `POST /api/users` - **Register new user** (public) or Create user (admin)
- `GET /api/users` - List all users (Admin only)
- `PATCH /api/users/{userId}` - Update user (Admin only)
- `DELETE /api/users/{userId}` - Delete user (Admin only)
- `GET /api/user/{userId}` - Get user details

### ✍️ Posts
- `POST /api/posts` - Create post
- `GET /api/posts/all` - Get all posts (Admin)
- `GET /api/posts/{userId}` - Get user posts
- `PATCH /api/posts/{postId}` - Update post

### 🧬 Brand DNA (Pro+)
- `POST /api/brand-dna` - Analyze brand DNA
- `GET /api/brand-dna/{userId}` - Get brand DNA

### 🎯 Content Strategy (Pro+)
- `POST /api/content-strategy` - Generate strategy
- `GET /api/content-strategy/{userId}` - Get strategy

### 🤖 AI Generation
- `POST /api/generate-post` - Generate content
- `POST /api/generate-image` - Generate image

### 💰 Payment (HyperPay)
- `POST /api/payment/checkout` - Create checkout
- `GET /api/payment/history` - Payment history
- `GET /api/payment/verify/{checkoutId}` - Verify payment

### 💳 Credits
- `GET /api/user/{userId}/credits` - Get credit balance
- `POST /api/user/credits/deduct` - Deduct credits
- `GET /api/user/{userId}/credit-history` - Transaction history
- `POST /api/user/upgrade-plan` - Upgrade plan

### 📊 Analytics
- `GET /api/analytics/{userId}` - User analytics
- `GET /api/stats` - System statistics

### ⚙️ Configuration (Admin)
- `GET /api/config` - Get all config
- `POST /api/config` - Create/update config
- `GET /api/config/{key}` - Get config by key
- `DELETE /api/config/{key}` - Delete config

### 📧 Email Logs (Admin)
- `GET /api/email-logs` - Get email logs

### 📝 Activity Logs
- `POST /api/logs` - Create log
- `GET /api/logs/{userId}` - Get user logs

---

## Authentication

Most endpoints require authentication. Include your JWT token in the Authorization header:

```bash
curl -X GET "http://localhost:3001/api/users" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Getting a Token

1. Login via the frontend
2. Check localStorage: `brandpilot_auth`
3. Extract the `token` field
4. Use in Swagger: `Bearer <token>`

---

## Testing Examples

### Example 1: Login and Get Bearer Token

**Endpoint:** `POST /api/login`

**No authentication required** - This is the first step!

**Body:**
```json
{
  "username": "yourusername",
  "password": "yourpassword"
}
```

**Response:**
```json
{
  "token": "abc123xyz789token",
  "role": "user",
  "userId": "user_123",
  "username": "yourusername",
  "plan": "pro",
  "credits": 8500,
  "maxCredits": 10000,
  "avatarStyle": "6366f1"
}
```

**Next Step:** Copy the `token` value and click the **Authorize** button in Swagger UI to use it for authenticated requests.

---

### Example 2: Register New User

**Endpoint:** `POST /api/users`

**No authentication required** - Public registration!

**Body:**
```json
{
  "username": "newuser",
  "password": "MySecurePass123",
  "email": "newuser@example.com"
}
```

**Response:**
```json
{
  "id": "user_456",
  "username": "newuser",
  "email": "newuser@example.com",
  "role": "user",
  "plan": "free",
  "credits": 1000,
  "maxCredits": 1000,
  "avatarStyle": "a3c5f2",
  "createdAt": "2026-01-17T12:34:56Z"
}
```

**Next Step:** Use the credentials from above with `POST /api/login` to get your Bearer token.

---

### Example 3: Get All Users (Admin)

**Endpoint:** `GET /api/users`

**Headers:**
```
Authorization: Bearer eyJhbGc...
```

**Response:**
```json
[
  {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "plan": "enterprise",
    "credits": 100000,
    "maxCredits": 100000,
    "_count": {
      "posts": 42
    }
  }
]
```

# BrandPilot OS - API Documentation (Swagger)

## 🚀 Interactive API Documentation

BrandPilot OS includes **complete Swagger/OpenAPI documentation** with interactive testing capabilities and **full Bearer token authentication**!

## Access Swagger UI

**Local Development:**
```
http://localhost:3001/api-docs
```

**Production:**
```
https://your-domain.com/api-docs
```

**OpenAPI JSON Spec:**
```
http://localhost:3001/api-docs.json
```

---

## 🔐 Authentication Required

**ALL API endpoints require Bearer token authentication** except:
- `POST /api/login` - User login
- `GET /api/test-connection` - Server connectivity test

### Authentication Headers
```javascript
Authorization: Bearer {your_token_here}
Content-Type: application/json
```

---

## Features

### ✨ Interactive Testing
- **Try It Out** - Test any endpoint directly from the browser
- **Live Request/Response** - See actual API responses in real-time
- **Parameter Validation** - Automatic validation of request parameters
- **Bearer Token Authentication** - Built-in authentication with secure tokens
- **Role-based Testing** - Test both User and Admin endpoints

### 📚 Complete Documentation
- **12 API Categories** - Authentication, Users, Posts, AI, Payment, and more
- **40+ Endpoints** - Full coverage of all platform APIs with authentication
- **Request Schemas** - Detailed parameter descriptions with examples
- **Response Schemas** - Expected response formats with status codes
- **Error Handling** - Common error responses documented
- **Authentication Examples** - Bearer token usage patterns

### 🎨 User-Friendly Interface
- **Search & Filter** - Quickly find specific endpoints
- **Categorized Tags** - Organized by functional area
- **Expandable Sections** - Clean, organized layout
- **Code Examples** - Request/response examples with authentication
- **Security Indicators** - Clear indication of protected endpoints

---

## Quick Start

### 1. Start the Server
```bash
node server.js
```
Server starts on port 3001 with Swagger enabled.

### 2. Open Swagger UI
Navigate to: `http://localhost:3001/api-docs`

### 3. Get Your Bearer Token

**Option A: Login with existing account**

1. Expand `POST /api/login` endpoint
2. Click **"Try it out"**
3. Enter your credentials:
   ```json
   {
     "username": "ruchi",
     "password": "123456"
   }
   ```
4. Click **"Execute"**
5. Copy the `token` value from the response

**Option B: Use test credentials**
```json
{
  "username": "ruchi",
  "password": "123456"
}
```
OR
```json
{
  "username": "ankit", 
  "password": "123456"
}
```

### 4. Authorize Swagger UI
1. Click the **"Authorize"** button (top right with green lock icon)
2. Paste your token (just the token value, NOT "Bearer ...")
3. Click **"Authorize"** then **"Close"**

Your token will now be automatically included in all requests!

### 5. Test an Endpoint
1. Expand any endpoint (e.g., `GET /api/me`)
2. Click **"Try it out"**
3. Modify parameters if needed
4. Click **"Execute"**
5. See live response with authentication!

---

## 🔓 API Endpoints Coverage

### 🔐 Authentication (No Auth Required)
- `POST /api/login` - User login (returns Bearer token)
- `GET /api/test-connection` - Test server connectivity

### 👤 User Management (Bearer Token Required)
- `GET /api/me` - Get current user profile
- `GET /api/user/stats/{userId}` - Get user statistics
- `PUT /api/users/{userId}` - Update user profile
- `DELETE /api/users/{userId}` - Delete user account

### 📝 Post Management (Bearer Token Required)
- `GET /api/posts` - Get all user posts
- `POST /api/posts` - Create new post
- `PUT /api/posts/{postId}` - Update post
- `DELETE /api/posts/{postId}` - Delete post
- `POST /api/publish` - Publish post to platforms

### 🤖 AI Content Generation (Bearer Token Required)
- `POST /api/brand-dna` - Analyze brand personality
- `POST /api/content-strategy` - Generate content strategy
- `POST /api/monetization-plan` - Generate monetization strategy
- `POST /api/posts/generate` - Generate AI posts
- `POST /api/generate-image` - Create AI images

### 🔗 Platform Integration (Bearer Token Required)
- `GET /api/platforms` - Get connected platforms
- `POST /api/platforms` - Connect platform
- `PUT /api/platforms/{platformId}` - Update platform
- `DELETE /api/platforms/{platformId}` - Disconnect platform

### ⚙️ Configuration (Bearer Token Required)
- `GET /api/config/auto_post_enabled` - Check auto-post status
- `PUT /api/config/auto_post_enabled` - Toggle auto-posting
- `GET /api/config/email` - Get email configuration
- `PUT /api/config/email` - Update email settings

### 💰 Payment System (Bearer Token Required)
- `POST /api/hyperpay/initialize` - Initialize payment
- `POST /api/hyperpay/process` - Process payment
- `GET /api/hyperpay/status/{paymentId}` - Check payment status
- `GET /api/payment-history` - Get payment history

### 🎯 Credits System (Bearer Token Required)
- `GET /api/credits/balance` - Get credit balance
- `POST /api/credits/transaction` - Create credit transaction
- `GET /api/credits/history` - Get credit history

### 📧 Email System (Bearer Token Required)
- `POST /api/send-email` - Send email notification
- `GET /api/email-logs` - Get email logs
- `POST /api/email/test` - Test email configuration

### 📊 Admin Endpoints (Bearer Token Required)
- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/posts` - Get all posts (admin only)
- `POST /api/admin/users/{userId}/credits` - Add credits (admin only)
- `DELETE /api/admin/posts/{postId}` - Delete any post (admin only)

---

## 🛠️ Development Tips

### Testing Authentication Flow

1. **Login First**:
   ```bash
   curl -X POST http://localhost:3001/api/login \
     -H "Content-Type: application/json" \
     -d '{"username":"ruchi","password":"123456"}'
   ```

2. **Copy Token from Response**:
   ```json
   {
     "success": true,
     "message": "Login successful",
     "token": "your-bearer-token-here",
     "user": { /* user data */ }
   }
   ```

3. **Use Token in Requests**:
   ```bash
   curl -X GET http://localhost:3001/api/me \
     -H "Authorization: Bearer your-token-here"
   ```

### Common Authentication Errors

**401 Unauthorized**:
- Missing or invalid Bearer token
- Token expired (7 days)
- Malformed Authorization header

**403 Forbidden**:
- Valid token but insufficient permissions
- Admin endpoints require admin role

### Token Management

- **Token Expires**: 7 days from login
- **Token Storage**: Store securely (localStorage for frontend)
- **Token Format**: JWT with user ID and role
- **Refresh Strategy**: Login again when token expires

---

## 🔍 Advanced Features

### Model Validation
All endpoints use **Joi validation** with detailed error responses.

### Error Handling
Standardized error responses with:
- HTTP status codes
- Error messages
- Validation details
- Stack traces (development only)

### Security Features
- **Bearer Token Authentication** on all protected endpoints
- **Password Hashing** with bcrypt and salt rounds
- **SQL Injection Protection** with Prisma ORM
- **Input Sanitization** and validation
- **Role-based Access Control** for admin endpoints

### Database Integration
- **Prisma ORM** for type-safe database operations
- **PostgreSQL** with full schema validation
- **Migration Support** for database updates
- **Seeded Test Data** for development

---

## 🐛 Troubleshooting

### Swagger UI Issues

**"Authorize" button not working**:
1. Ensure server is running on port 3001
2. Check browser console for errors
3. Clear browser cache and reload

**"Try it out" gives 401 errors**:
1. Verify you're logged in and have a valid token
2. Check token wasn't double-pasted in Authorization
3. Ensure token hasn't expired (7 days)

**Schema validation errors**:
1. Check required fields are provided
2. Verify data types match schema
3. Review parameter descriptions for format requirements

### API Connection Issues

**CORS errors in browser**:
- Ensure frontend runs on port 5173
- Backend automatically allows CORS for development

**Database connection errors**:
- Check DATABASE_URL in environment variables
- Verify PostgreSQL service is running
- Run `npx prisma migrate dev` if needed

**Missing environment variables**:
- Copy `.env.example` to `.env`
- Set all required variables before starting server

---

## 📋 Production Checklist

Before deploying to production:

- [ ] Set secure `JWT_SECRET` environment variable
- [ ] Configure production `DATABASE_URL`
- [ ] Set proper `CORS_ORIGIN` for your domain
- [ ] Enable HTTPS for secure token transmission
- [ ] Update Swagger host URL for production
- [ ] Test all endpoints with production authentication
- [ ] Verify admin endpoints are properly restricted
- [ ] Monitor authentication logs and errors

---

## 📚 Additional Resources

- **Main Documentation**: See README.md
- **Authentication Guide**: AUTHENTICATION_GUIDE.md  
- **Database Schema**: DATABASE_SCHEMA.md
- **Payment Integration**: PAYMENT_INTEGRATION_README.md
- **Email Configuration**: EMAIL_SETUP.md

---

## 🆘 Support

Having trouble with the API documentation?

1. **Check the logs**: Server console shows detailed error information
2. **Verify authentication**: Most issues are authentication-related
3. **Test with curl**: Validate endpoints outside Swagger UI
4. **Review this documentation**: Covers most common scenarios
5. **Check environment**: Ensure all required variables are set

The interactive Swagger documentation makes testing and integration straightforward with complete Bearer token authentication support!
