/**
 * @swagger
 * tags:
 *   - name: System
 *     description: System health and connectivity endpoints
 */

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with username and password. Returns a Bearer token for subsequent API calls. Use this token in the "Authorize" button above.
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: User's username
 *                 example: johndoe
 *               password:
 *                 type: string
 *                 description: User's password (will be hashed with SHA-256)
 *                 example: mySecurePassword123
 *     responses:
 *       200:
 *         description: Login successful. Copy the 'token' value and use it in the Authorize button (click the lock icon and paste the token).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Bearer token to use for authenticated requests (copy this for authorization)
 *                   example: abc123xyz789token
 *                 role:
 *                   type: string
 *                   enum: [admin, user]
 *                   example: user
 *                 userId:
 *                   type: string
 *                   example: user_123
 *                 username:
 *                   type: string
 *                   example: johndoe
 *                 plan:
 *                   type: string
 *                   enum: [free, pro, business, enterprise]
 *                   example: pro
 *                 credits:
 *                   type: integer
 *                   example: 8500
 *                 maxCredits:
 *                   type: integer
 *                   example: 10000
 *                 avatarStyle:
 *                   type: string
 *                   description: Hex color code for user avatar
 *                   example: 6366f1
 *             example:
 *               token: "abc123xyz789token"
 *               role: "user"
 *               userId: "user_123"
 *               username: "johndoe"
 *               plan: "pro"
 *               credits: 8500
 *               maxCredits: 10000
 *               avatarStyle: "6366f1"
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid credentials
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Username and password are required
 *
 * @swagger
 * /api/logout:
 *   post:
 *     summary: User logout
 *     description: Invalidate the current session token. The token will no longer be valid for API calls.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful, session token invalidated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 * @swagger
 * /api/me:
 *   get:
 *     summary: Get current user
 *     description: Retrieve information about the currently authenticated user based on the Bearer token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: user_123
 *                 username:
 *                   type: string
 *                   example: johndoe
 *                 role:
 *                   type: string
 *                   enum: [admin, user]
 *                   example: user
 *                 plan:
 *                   type: string
 *                   enum: [free, pro, business, enterprise]
 *                   example: pro
 *                 credits:
 *                   type: integer
 *                   example: 8500
 *             example:
 *               id: "user_123"
 *               username: "johndoe"
 *               role: "user"
 *               plan: "pro"
 *               credits: 8500
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 * @swagger
 * /api/validate-token:
 *   post:
 *     summary: Validate authentication token
 *     description: Verify JWT token and return user information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     description: Retrieve list of all users with post counts. Requires admin role.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/User'
 *                   - type: object
 *                     properties:
 *                       _count:
 *                         type: object
 *                         properties:
 *                           posts:
 *                             type: integer
 *                             example: 42
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   post:
 *     summary: Register new user / Create user
 *     description: |
 *       **Public Registration:** Anyone can create a new user account. Defaults to 'user' role and 'free' plan with 1000 credits.
 *       
 *       **Admin User Creation:** Authenticated admins can specify role, plan, and credit limits.
 *       
 *       After successful registration, use the POST /api/login endpoint with the same credentials to get your Bearer token.
 *     tags: [Users]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Unique username for the account
 *                 example: john_doe
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Password (will be hashed with SHA-256)
 *                 example: SecurePass123!
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address (optional)
 *                 example: john@example.com
 *               role:
 *                 type: string
 *                 enum: [admin, user]
 *                 default: user
 *                 description: User role (admin-only, defaults to 'user' for public registration)
 *                 example: user
 *               plan:
 *                 type: string
 *                 enum: [free, pro, business, enterprise]
 *                 default: free
 *                 description: Subscription plan (admin-only, defaults to 'free' for public registration)
 *                 example: pro
 *               credits:
 *                 type: integer
 *                 description: Initial credits (optional, defaults to plan limit)
 *                 example: 10000
 *               maxCredits:
 *                 type: integer
 *                 description: Maximum credits allowed (optional, enforced by plan limit)
 *                 example: 10000
 *               avatarStyle:
 *                 type: string
 *                 description: Hex color for avatar (auto-generated if not provided)
 *                 example: 6366f1
 *           examples:
 *             publicRegistration:
 *               summary: Public user registration
 *               value:
 *                 username: "newuser"
 *                 password: "MySecurePass123"
 *                 email: "newuser@example.com"
 *             adminCreation:
 *               summary: Admin creating a pro user
 *               value:
 *                 username: "john_doe"
 *                 password: "SecurePass123!"
 *                 email: "john@example.com"
 *                 role: "user"
 *                 plan: "pro"
 *                 credits: 10000
 *     responses:
 *       201:
 *         description: User created successfully. Now use POST /api/login to get your token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *             example:
 *               id: "user_123"
 *               username: "john_doe"
 *               email: "john@example.com"
 *               role: "user"
 *               plan: "pro"
 *               credits: 10000
 *               maxCredits: 10000
 *               avatarStyle: "6366f1"
 *               createdAt: "2024-01-17T10:30:00.000Z"
 *       400:
 *         description: Validation error or username already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             examples:
 *               missingFields:
 *                 summary: Missing required fields
 *                 value:
 *                   error: "Username and password are required"
 *               duplicateUsername:
 *                 summary: Username already exists
 *                 value:
 *                   error: "Username already exists"
 *               invalidRole:
 *                 summary: Invalid role
 *                 value:
 *                   error: "Invalid role. Must be admin or user."
 *               invalidPlan:
 *                 summary: Invalid plan
 *                 value:
 *                   error: "Invalid plan."
 */

/**
 * @swagger
 * /api/users/{userId}:
 *   patch:
 *     summary: Update user (Admin only)
 *     description: Update user details with automatic credit adjustment on plan changes
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: john_doe_updated
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.new@example.com
 *               role:
 *                 type: string
 *                 enum: [admin, user]
 *                 example: user
 *               plan:
 *                 type: string
 *                 enum: [free, pro, business, enterprise]
 *                 example: business
 *               credits:
 *                 type: integer
 *                 example: 50000
 *                 description: Cannot exceed plan's maxCredits
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     summary: Delete user (Admin only)
 *     description: Delete user and all associated data (posts, logs, transactions)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User deleted successfully
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create new post
 *     description: Create a new social media post (draft, scheduled, or immediate publish)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - platform
 *               - caption
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1
 *               platform:
 *                 type: string
 *                 enum: ['X (Twitter)', 'Facebook', 'Instagram']
 *                 example: 'X (Twitter)'
 *               caption:
 *                 type: string
 *                 example: 'Check out our latest feature! 🚀'
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 example: 'https://res.cloudinary.com/demo/image.jpg'
 *               scheduledFor:
 *                 type: string
 *                 format: date-time
 *                 description: ISO 8601 timestamp for scheduling
 *                 example: '2026-01-20T10:00:00Z'
 *               status:
 *                 type: string
 *                 enum: [draft, scheduled, published]
 *                 default: draft
 *                 example: scheduled
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/posts/all:
 *   get:
 *     summary: Get all posts (Admin only)
 *     description: Retrieve all posts from all users with platform responses
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Post'
 *                   - type: object
 *                     properties:
 *                       user:
 *                         $ref: '#/components/schemas/User'
 *                       platformResponses:
 *                         type: array
 *                         items:
 *                           type: object
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/posts/{userId}:
 *   get:
 *     summary: Get user's posts
 *     description: Retrieve all posts for a specific user
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User's posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/brand-dna:
 *   post:
 *     summary: Analyze brand DNA (Pro+ plan)
 *     description: AI-powered brand identity analysis from past posts
 *     tags: [Brand DNA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - pastPosts
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1
 *               pastPosts:
 *                 type: string
 *                 example: 'Post 1: Excited to announce...\nPost 2: Here are our core values...'
 *     responses:
 *       200:
 *         description: Brand DNA generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BrandDNA'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Plan upgrade required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Pro+ plan required for Brand DNA feature
 */

/**
 * @swagger
 * /api/brand-dna/{userId}:
 *   get:
 *     summary: Get user's brand DNA
 *     description: Retrieve existing brand DNA for a user
 *     tags: [Brand DNA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Brand DNA retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BrandDNA'
 *       404:
 *         description: Brand DNA not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 brandDna:
 *                   type: 'null'
 */

/**
 * @swagger
 * /api/generate-post:
 *   post:
 *     summary: Generate AI content
 *     description: Generate social media post content using AI based on topic and platform
 *     tags: [AI Generation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - topic
 *               - platform
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1
 *               topic:
 *                 type: string
 *                 example: 'AI innovation in healthcare'
 *               platform:
 *                 type: string
 *                 enum: ['X (Twitter)', 'Facebook', 'Instagram', 'LinkedIn']
 *                 example: 'X (Twitter)'
 *               imagePrompt:
 *                 type: string
 *                 example: 'futuristic medical technology'
 *                 description: Optional AI image generation prompt
 *     responses:
 *       200:
 *         description: Content generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 caption:
 *                   type: string
 *                   example: 'AI is revolutionizing healthcare...'
 *                 imageUrl:
 *                   type: string
 *                   format: uri
 *                   example: 'https://res.cloudinary.com/...'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/payment/checkout:
 *   post:
 *     summary: Initiate payment checkout
 *     description: Create HyperPay checkout session for plan upgrade
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - plan
 *               - amount
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1
 *               plan:
 *                 type: string
 *                 enum: [pro, business, enterprise]
 *                 example: pro
 *               amount:
 *                 type: number
 *                 format: float
 *                 example: 99.99
 *               currency:
 *                 type: string
 *                 default: SAR
 *                 example: SAR
 *     responses:
 *       200:
 *         description: Checkout session created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 checkoutId:
 *                   type: string
 *                   example: '8ac7a4c99...'
 *                 redirectUrl:
 *                   type: string
 *                   format: uri
 *                   example: 'https://test.oppwa.com/v1/paymentWidgets.js?checkoutId=...'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         description: Payment service error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Payment service not configured
 */

/**
 * @swagger
 * /api/payment/history:
 *   get:
 *     summary: Get payment history
 *     description: Retrieve user's payment transaction history
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: User ID (optional - defaults to authenticated user)
 *     responses:
 *       200:
 *         description: Payment history retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PaymentTransaction'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/user/{userId}/credits:
 *   get:
 *     summary: Get user credit balance
 *     description: Retrieve current credit balance and limit for user
 *     tags: [Credits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Credit information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 credits:
 *                   type: integer
 *                   example: 8500
 *                 maxCredits:
 *                   type: integer
 *                   example: 10000
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /api/user/{userId}/credit-history:
 *   get:
 *     summary: Get credit transaction history
 *     description: Retrieve all credit transactions for a user
 *     tags: [Credits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Credit transaction history
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CreditTransaction'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /api/email-logs:
 *   get:
 *     summary: Get email logs (Admin only)
 *     description: Retrieve email notification logs with filtering
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [post_published, credits_low, payment_success, all]
 *         description: Filter by email type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [sent, failed, all]
 *         description: Filter by send status
 *     responses:
 *       200:
 *         description: Email logs retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EmailLog'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/config:
 *   get:
 *     summary: Get all configuration (Admin only)
 *     description: Retrieve all platform configuration settings from database
 *     tags: [Configuration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuration retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   key:
 *                     type: string
 *                     example: x_api_key
 *                   value:
 *                     type: string
 *                     example: '***hidden***'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   post:
 *     summary: Create/Update configuration (Admin only)
 *     description: Add or update platform configuration setting
 *     tags: [Configuration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *               - value
 *             properties:
 *               key:
 *                 type: string
 *                 example: x_api_key
 *               value:
 *                 type: string
 *                 example: your_api_key_value
 *     responses:
 *       200:
 *         description: Configuration saved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Configuration saved
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/analytics/{userId}:
 *   get:
 *     summary: Get user analytics
 *     description: Retrieve performance analytics and statistics for user
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalPosts:
 *                   type: integer
 *                   example: 150
 *                 publishedPosts:
 *                   type: integer
 *                   example: 142
 *                 scheduledPosts:
 *                   type: integer
 *                   example: 8
 *                 platformBreakdown:
 *                   type: object
 *                   properties:
 *                     'X (Twitter)':
 *                       type: integer
 *                       example: 80
 *                     Facebook:
 *                       type: integer
 *                       example: 45
 *                     Instagram:
 *                       type: integer
 *                       example: 25
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
