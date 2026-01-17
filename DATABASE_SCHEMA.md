# BrandPilot OS - Database Schema Documentation

## Overview
The database uses PostgreSQL with Prisma ORM. The schema supports user management, subscription plans, credit tracking, content management, and audit logging.

---

## Database Models

### 1. User Model
Stores user authentication, plan information, and credit balance.

```prisma
model User {
  id              String        @id @default(uuid())
  username        String        @unique
  passwordHash    String
  role            String        // 'admin' | 'user'
  plan            String        @default("free") // 'free' | 'pro' | 'business' | 'enterprise'
  credits         Int           @default(1000) // Current AI credits
  maxCredits      Int           @default(1000) // Max credits per billing period
  creditsResetAt  DateTime?     // Last credit reset timestamp
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @default(now()) @updatedAt
  
  // Relations
  sessions        Session[]
  posts           Post[]
  logs            Log[]
  creditHistory   CreditTransaction[]
  subscriptions   Subscription[]
}
```

**Fields:**
- `plan`: User's subscription tier (free/pro/business/enterprise)
- `credits`: Remaining credits for AI operations
- `maxCredits`: Credit limit based on plan
- `creditsResetAt`: When credits were last reset (monthly)

---

### 2. Session Model
Manages user authentication sessions with JWT tokens.

```prisma
model Session {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  createdAt DateTime @default(now())
  expiresAt DateTime
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([token])
}
```

**Purpose:** 
- Session persistence across page refreshes
- Token validation and auto-logout
- 7-day default expiry

---

### 3. Post Model
Stores social media posts across all platforms.

```prisma
model Post {
  id           String   @id @default(uuid())
  userId       String
  platform     String   // 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube'
  content      String
  imageUrl     String?
  status       String   // 'draft' | 'scheduled' | 'published' | 'failed'
  scheduledFor DateTime?
  publishedAt  DateTime?
  metadata     String?  // JSON string for platform-specific data
  createdAt    DateTime @default(now())
  updatedAt    DateTime @default(now()) @updatedAt
  
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([createdAt])
  @@index([status])
}
```

**Usage:**
- Monthly post limits enforced by plan
- Track publishing status
- Platform-specific metadata storage

---

### 4. CreditTransaction Model ✨ NEW
Detailed audit log of all credit operations.

```prisma
model CreditTransaction {
  id            String   @id @default(uuid())
  userId        String
  amount        Int      // Positive for additions, negative for deductions
  action        String   // 'brand_dna', 'content_generation', 'image_generation', etc.
  description   String?
  balanceBefore Int      // Credit balance before transaction
  balanceAfter  Int      // Credit balance after transaction
  createdAt     DateTime @default(now())
  
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([createdAt])
}
```

**Actions Tracked:**
- `brand_dna` - 100 credits
- `content_strategy` - 50 credits
- `image_generation` - 50 credits
- `monetization_analysis` - 30 credits
- `post_generation` - 10 credits
- `publishing` - 5 credits
- `plan_upgrade` - Credit reset on upgrade

**Benefits:**
- Complete audit trail
- Before/after balance tracking
- Detailed transaction history
- Compliance and debugging

---

### 5. Subscription Model ✨ NEW
Manages paid subscriptions and billing cycles.

```prisma
model Subscription {
  id                   String   @id @default(uuid())
  userId               String
  plan                 String   // 'free' | 'pro' | 'business' | 'enterprise'
  status               String   // 'active' | 'cancelled' | 'expired' | 'trial'
  stripeCustomerId     String?  @unique
  stripeSubscriptionId String?  @unique
  currentPeriodStart   DateTime?
  currentPeriodEnd     DateTime?
  cancelAtPeriodEnd    Boolean  @default(false)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @default(now()) @updatedAt
  
  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([status])
}
```

**Integration Points:**
- Stripe customer/subscription IDs
- Billing period tracking
- Cancellation handling
- Plan upgrade/downgrade history

---

### 6. Log Model (Legacy)
Generic logging for all system events.

```prisma
model Log {
  id        String   @id @default(uuid())
  userId    String
  action    String
  details   String
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id])
}
```

**Note:** Being phased out in favor of CreditTransaction for credit-related logs.

---

### 7. Config & Token Models
System configuration and API credentials.

```prisma
model Config {
  id       String @id @default(uuid())
  key      String @unique
  value    String
  category String
}

model Token {
  id           String   @id @default(uuid())
  service      String   @unique
  accessToken  String
  refreshToken String?
  expiresAt    DateTime?
}
```

---

## Plan Limits Configuration

| Feature               | Free    | Pro       | Business  | Enterprise |
|-----------------------|---------|-----------|-----------|------------|
| **Price**             | $0      | $29/mo    | $79/mo    | Custom     |
| **Credits/Month**     | 1,000   | 10,000    | 50,000    | Unlimited  |
| **Posts/Month**       | 10      | Unlimited | Unlimited | Unlimited  |
| **Platforms**         | 2       | 5         | 6         | All        |
| **Brand DNA**         | ❌      | ✅        | ✅        | ✅         |
| **Content Strategist**| ❌      | ✅        | ✅        | ✅         |
| **Monetization**      | ❌      | ✅        | ✅        | ✅         |
| **API Access**        | ❌      | ❌        | ✅        | ✅         |
| **Team Features**     | ❌      | ❌        | ✅        | ✅         |

---

## API Endpoints

### Authentication

#### POST `/api/login`
Authenticate user and create session.

**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "username": "string",
    "role": "admin" | "user",
    "plan": "free" | "pro" | "business" | "enterprise",
    "credits": 1000,
    "maxCredits": 1000
  },
  "token": "jwt_token"
}
```

#### POST `/api/validate-token`
Validate session token and return user data.

**Request:**
```json
{
  "token": "jwt_token"
}
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "id": "uuid",
    "username": "string",
    "role": "admin" | "user",
    "plan": "free",
    "credits": 1000
  }
}
```

---

### Credit Management

#### GET `/api/user/:userId/credits`
Get user's current credit balance.

**Response:**
```json
{
  "credits": 1000,
  "maxCredits": 1000,
  "plan": "free"
}
```

#### POST `/api/user/credits/deduct`
Deduct credits from user account.

**Request:**
```json
{
  "userId": "uuid",
  "amount": 100,
  "action": "brand_dna",
  "description": "Brand DNA analysis"
}
```

**Response:**
```json
{
  "success": true,
  "credits": 900,
  "transaction": {
    "id": "uuid",
    "balanceBefore": 1000,
    "balanceAfter": 900
  }
}
```

#### GET `/api/user/:userId/credit-history` ✨ NEW
Get paginated credit transaction history.

**Query Params:**
- `limit` (default: 50)
- `offset` (default: 0)

**Response:**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "amount": -100,
      "action": "brand_dna",
      "description": "Brand DNA analysis",
      "balanceBefore": 1000,
      "balanceAfter": 900,
      "createdAt": "2026-01-16T13:30:00Z"
    }
  ],
  "total": 150
}
```

---

### Subscription Management

#### POST `/api/user/upgrade-plan` ✨ ENHANCED
Upgrade user to new plan with Stripe integration.

**Request:**
```json
{
  "userId": "uuid",
  "newPlan": "pro",
  "stripeCustomerId": "cus_xxx",
  "stripeSubscriptionId": "sub_xxx"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "plan": "pro",
    "credits": 10000,
    "maxCredits": 10000
  },
  "subscription": {
    "id": "uuid",
    "status": "active",
    "currentPeriodStart": "2026-01-16T13:30:00Z",
    "currentPeriodEnd": "2026-02-16T13:30:00Z"
  }
}
```

#### GET `/api/user/:userId/subscription` ✨ NEW
Get active subscription details.

**Response:**
```json
{
  "subscription": {
    "id": "uuid",
    "plan": "pro",
    "status": "active",
    "stripeCustomerId": "cus_xxx",
    "stripeSubscriptionId": "sub_xxx",
    "currentPeriodStart": "2026-01-16T13:30:00Z",
    "currentPeriodEnd": "2026-02-16T13:30:00Z",
    "cancelAtPeriodEnd": false
  }
}
```

#### POST `/api/user/subscription/cancel` ✨ NEW
Cancel subscription (active until period end).

**Request:**
```json
{
  "userId": "uuid",
  "subscriptionId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "subscription": {
    "status": "cancelled",
    "cancelAtPeriodEnd": true
  }
}
```

---

### Post Management

#### GET `/api/user/:userId/post-count`
Get monthly post count for plan limit enforcement.

**Response:**
```json
{
  "count": 5
}
```

---

## Migration History

1. **20260116080159_init_brandpilot_schema** - Initial schema
2. **20260116125410_add_user_plan_fields** - Added plan, credits, maxCredits to User
3. **20260116133331_add_credit_and_subscription_models** ✨ NEW
   - Added CreditTransaction model
   - Added Subscription model
   - Added creditsResetAt, updatedAt to User
   - Added publishedAt, metadata, updatedAt to Post
   - Added indexes for performance
   - Added onDelete cascades

---

## Usage Examples

### Checking Feature Access
```typescript
import { canUseFeature, canAccessPlatform } from './services/planService';

// Check if user can use Brand DNA
if (!canUseFeature(userPlan, 'brandDNA')) {
  // Show upgrade prompt
}

// Check platform access
if (!canAccessPlatform(userPlan, 'linkedin')) {
  // Lock platform
}
```

### Deducting Credits
```typescript
import { deductCredits, getUserCredits } from './services/creditService';

// Before AI operation
const currentCredits = await getUserCredits(userId);
if (currentCredits < 100) {
  // Show insufficient credits warning
}

// Deduct credits
const result = await deductCredits(userId, 100, 'brand_dna');
console.log(`New balance: ${result.credits}`);
```

### Monthly Credit Reset (Cron Job)
```typescript
// Run on 1st of each month
async function resetMonthlyCredits() {
  const users = await prisma.user.findMany({
    where: {
      plan: { not: 'free' },
      subscriptions: {
        some: { status: 'active' }
      }
    }
  });

  for (const user of users) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          credits: user.maxCredits,
          creditsResetAt: new Date()
        }
      }),
      prisma.creditTransaction.create({
        data: {
          userId: user.id,
          amount: user.maxCredits,
          action: 'monthly_reset',
          description: 'Monthly credit reset',
          balanceBefore: user.credits,
          balanceAfter: user.maxCredits
        }
      })
    ]);
  }
}
```

---

## Next Steps (Optional Enhancements)

1. **Stripe Webhook Integration**
   - Handle subscription renewals
   - Process failed payments
   - Automatic plan downgrades

2. **Usage Analytics**
   - Aggregate credit usage by action type
   - Platform usage statistics
   - ROI tracking per feature

3. **Team Features (Business+)**
   - Team members table
   - Role-based permissions
   - Shared credit pools

4. **API Keys (Business+)**
   - Generate API keys for external access
   - Rate limiting per key
   - Usage tracking

---

## Security Notes

- All passwords are hashed with bcrypt
- Sessions expire after 7 days
- Tokens validated every 5 minutes client-side
- Database uses Cascade deletes for data integrity
- Credit transactions are immutable (audit trail)
- Stripe IDs stored for payment reconciliation

---

**Last Updated:** 2026-01-16  
**Schema Version:** 3.0  
**Prisma Version:** 6.15.0
