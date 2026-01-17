# Credits System Implementation (with Authentication)

## Overview
The BrandPilot OS now includes a comprehensive credits management system that tracks credit usage, maintains transaction history, and automatically deducts credits when users publish content to social media platforms. **All credit operations require Bearer token authentication.**

## Features

### 1. Credits & Usage Tab (Authenticated)
- **Location**: Accessible from the sidebar navigation (after login)
- **Authentication**: Requires valid Bearer token for all operations
- **Features**:
  - Current credit balance with visual progress bar
  - Credit costs reference (Brand DNA: 50, Content: 30, Image: 40)
  - Full transaction history with pagination
  - Detailed transaction information (date, action, amount, balance)
  - Color-coded transactions (green for additions, red for deductions)

### 2. Automatic Credit Deduction (Authenticated)
Credits are automatically deducted when users (with valid authentication):
- **Publish Content** (30 credits): When posting to any social media platform
- **Generate Brand DNA** (50 credits): When creating brand identity analysis
- **Generate Images** (40 credits): When creating AI-generated images

### 3. Transaction History (Secure)
All credit activities are logged in the `CreditTransaction` table with:
- Transaction ID
- User ID (authenticated user only)
- Amount (positive for additions, negative for deductions)
- Action type (content_publish, brand_dna, image_generation, etc.)
- Description
- Balance before transaction
- Balance after transaction
- Timestamp

## API Endpoints (Bearer Token Required)

### Get User Credits
```
GET /api/user/:userId/credits
Authorization: Bearer {token}
```
Returns current credit balance for authenticated user.

### Get Credit History  
```
GET /api/user/:userId/credit-history?limit=50&offset=0
Authorization: Bearer {token}
```
Returns paginated transaction history for authenticated user.

**Query Parameters**:
- `limit`: Number of transactions to return (default: 50)
- `offset`: Number of transactions to skip (default: 0)

**Authentication Headers**:
```javascript
Authorization: Bearer {your_token_here}
Content-Type: application/json
```

**Response**:
```json
{
  "transactions": [
    {
      "id": "trans_123",
      "userId": "user_456",
      "amount": -30,
      "action": "content_publish",
      "description": "Published content to Instagram",
      "balanceBefore": 1000,
      "balanceAfter": 970,
      "createdAt": "2024-01-16T12:00:00Z"
    }
  ],
  "total": 145
}
```

### Deduct Credits
```
POST /api/user/credits/deduct
```
Manually deduct credits from a user account.

**Request Body**:
```json
{
  "userId": "user_123",
  "amount": 30,
  "action": "content_publish",
  "description": "Published content to Twitter"
}
```

**Response**:
```json
{
  "success": true,
  "credits": 970,
  "transaction": {
    "id": "trans_789",
    "balanceBefore": 1000,
    "balanceAfter": 970
  }
}
```

## Database Schema

### CreditTransaction Model
```prisma
model CreditTransaction {
  id            String   @id @default(cuid())
  userId        String
  amount        Int      // Negative for deductions, positive for additions
  action        String   // e.g., "content_publish", "brand_dna", "image_generation"
  description   String?
  balanceBefore Int
  balanceAfter  Int
  createdAt     DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([createdAt])
}
```

### User Model (Credits Fields)
```prisma
model User {
  id          String   @id @default(cuid())
  username    String   @unique
  password    String
  role        String   @default("user")
  plan        String   @default("free")
  credits     Int      @default(1000)
  maxCredits  Int      @default(1000)
  // ... other fields
  
  creditTransactions CreditTransaction[]
}
```

## Credit Costs

| Action | Cost | Description |
|--------|------|-------------|
| Brand DNA Generation | 50 | Creating brand identity analysis |
| Content Publishing | 30 | Publishing to any social platform |
| Image Generation | 40 | AI-generated images |

## Implementation Details

### Frontend Components

#### Credits Component
**File**: `components/Credits.tsx`
- Displays credit balance with progress bar
- Shows transaction history table
- Fetches data from backend API
- Handles pagination
- Color-coded transaction types

#### Integration Points
1. **App.tsx**: Added Credits tab rendering
2. **Sidebar.tsx**: Added "Credits & Usage" menu item with CreditCard icon
3. **ContentEngine.tsx**: Passes userId to publish functions
4. **types.ts**: Added 'credits' to ActiveTab type

### Backend Integration

#### server.js Updates
1. **POST /api/publish**: Added credit deduction logic before publishing
   - Checks user has sufficient credits
   - Deducts 30 credits for content publishing
   - Creates transaction record
   - Returns error if insufficient credits

2. **GET /api/user/:userId/credit-history**: Already existed
   - Returns paginated transaction history
   - Ordered by most recent first

3. **POST /api/user/credits/deduct**: Already existed
   - Manual credit deduction
   - Creates transaction record
   - Updates user balance atomically

### Client-Side Updates

#### gemini.client.ts
- Updated `publishToPlatform` to accept userId in metadata
- Updated `platformAPI.publish` to pass userId
- Sends userId with publish requests

#### ContentEngine.tsx
- Accepts userId prop from App.tsx
- Passes userId in all publish calls
- Uses userId when saving posts to database

## Error Handling

### Insufficient Credits
When a user tries to publish without enough credits:
```json
{
  "error": "Insufficient credits",
  "required": 30,
  "available": 15
}
```

The frontend displays this error and prompts the user to upgrade their plan.

### Transaction Failures
If credit deduction fails during publish:
- The publish operation is aborted
- No content is posted to social media
- User sees error message
- Credits are not deducted

## Testing

### Manual Testing
1. Navigate to Credits & Usage tab
2. Check current balance is displayed
3. Publish content to a platform
4. Verify:
   - Credits are deducted (30 credits)
   - Transaction appears in history
   - Balance updates in real-time
   - Transaction shows correct before/after amounts

### Test Scenarios
1. **Normal Publishing**: User with 1000 credits publishes content
   - Expected: 970 credits remaining, transaction logged
   
2. **Insufficient Credits**: User with 20 credits tries to publish
   - Expected: Error message, no publish, credits unchanged
   
3. **Multiple Publishes**: User publishes to 3 platforms
   - Expected: 90 credits deducted (30 × 3), 3 transactions logged

## Future Enhancements

1. **Credit Packages**: Allow users to purchase additional credits
2. **Monthly Reset**: Reset credits to maxCredits on plan anniversary
3. **Credit Alerts**: Notify users when credits are low (< 10%)
4. **Refund Logic**: Refund credits if publish fails
5. **Bulk Discounts**: Reduced cost per action for high-volume users
6. **Credit Expiration**: Expire unused credits after a certain period
7. **Gift Credits**: Allow admins to grant bonus credits

## Troubleshooting

### Credits Not Deducting
1. Check userId is passed in publish request
2. Verify user exists in database
3. Check server logs for credit deduction errors
4. Ensure prisma connection is working

### Transaction History Not Loading
1. Check API endpoint is accessible
2. Verify userId matches authenticated user
3. Check browser console for fetch errors
4. Verify CreditTransaction records exist in database

### Balance Not Updating in UI
1. Check `onCreditsUpdate` callback is called
2. Verify state updates in App.tsx
3. Check Credits component fetches latest data
4. Force refresh the Credits tab

## Migration Notes

If you're upgrading from a previous version:

1. **Database Migration**: The CreditTransaction model should already exist
2. **User Credits**: Existing users should have credits and maxCredits set
3. **Backwards Compatibility**: Old publish endpoints still work without userId (won't deduct credits)
4. **Testing**: Test credit deduction in development before production deployment

## Related Files

- `components/Credits.tsx` - Credits UI component
- `components/ContentEngine.tsx` - Publishing logic
- `services/gemini.client.ts` - API client functions
- `server.js` - Backend endpoints
- `prisma/schema.prisma` - Database schema
- `types.ts` - TypeScript type definitions
