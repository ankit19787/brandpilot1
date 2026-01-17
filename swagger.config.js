// Swagger/OpenAPI Configuration for BrandPilot OS API
export const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'BrandPilot OS API',
    version: '1.0.0',
    description: `
# BrandPilot OS - Social Media Automation Platform API

Complete API documentation for BrandPilot OS, a powerful social media automation and content management platform.

## Features
- 🔐 User Authentication & Authorization
- 👥 User Management (Admin)
- 🧬 Brand DNA Analysis (AI-powered)
- 🎯 Content Strategy Generation
- ✍️ AI Content Generation
- 📅 Post Scheduling & Publishing
- 💰 Payment Integration (HyperPay)
- 📊 Analytics & Performance Tracking
- 📧 Email Notifications
- ⚙️ Configuration Management

## Authentication
Most endpoints require authentication. Include the Bearer token in the Authorization header:
\`\`\`
Authorization: Bearer <your-token>
\`\`\`

## Base URL
Development: \`http://localhost:3001\`
Production: \`https://your-domain.com\`

## Rate Limiting
API calls are subject to rate limiting based on your subscription plan.

## Support
For issues or questions, check the Platform Responses tab in the admin panel.
    `,
    contact: {
      name: 'BrandPilot OS Support',
      email: 'support@brandpilot.com'
    },
    license: {
      name: 'Proprietary',
      url: 'https://brandpilot.com/license'
    }
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server'
    },
    {
      url: 'https://api.brandpilot.com',
      description: 'Production server'
    }
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and token validation'
    },
    {
      name: 'Users',
      description: 'User management and profile operations'
    },
    {
      name: 'Posts',
      description: 'Content creation, scheduling, and publishing'
    },
    {
      name: 'Brand DNA',
      description: 'AI-powered brand identity analysis (Pro+ plan)'
    },
    {
      name: 'Content Strategy',
      description: 'AI-generated content strategies (Pro+ plan)'
    },
    {
      name: 'AI Generation',
      description: 'AI-powered content and image generation'
    },
    {
      name: 'Payment',
      description: 'HyperPay payment integration and transactions'
    },
    {
      name: 'Analytics',
      description: 'Performance metrics and statistics'
    },
    {
      name: 'Configuration',
      description: 'Platform configuration and credentials (Admin only)'
    },
    {
      name: 'Email',
      description: 'Email notification logs'
    },
    {
      name: 'Logs',
      description: 'Activity and audit logs'
    },
    {
      name: 'Credits',
      description: 'Credit system and transactions'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token obtained from login'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          username: { type: 'string', example: 'john_doe' },
          email: { type: 'string', format: 'email', example: 'john@example.com', nullable: true },
          role: { type: 'string', enum: ['admin', 'user'], example: 'user' },
          plan: { type: 'string', enum: ['free', 'pro', 'business', 'enterprise'], example: 'pro' },
          credits: { type: 'integer', example: 10000 },
          maxCredits: { type: 'integer', example: 10000 },
          createdAt: { type: 'string', format: 'date-time' },
          avatarStyle: { type: 'string', example: '6366f1', nullable: true }
        }
      },
      Post: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          userId: { type: 'integer', example: 1 },
          platform: { type: 'string', enum: ['X (Twitter)', 'Facebook', 'Instagram'], example: 'X (Twitter)' },
          caption: { type: 'string', example: 'Check out our latest update!' },
          imageUrl: { type: 'string', format: 'uri', example: 'https://res.cloudinary.com/...', nullable: true },
          scheduledFor: { type: 'string', format: 'date-time', nullable: true },
          publishedAt: { type: 'string', format: 'date-time', nullable: true },
          status: { type: 'string', enum: ['draft', 'scheduled', 'published', 'failed'], example: 'scheduled' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      BrandDNA: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          userId: { type: 'integer', example: 1 },
          identity: { type: 'string', example: 'Innovative tech startup focused on AI solutions' },
          voice: { type: 'string', example: 'Professional yet approachable, enthusiastic about technology' },
          audience: { type: 'string', example: 'Tech-savvy professionals, developers, startup founders' },
          values: { type: 'string', example: 'Innovation, Transparency, User-centric design' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      ContentStrategy: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          userId: { type: 'integer', example: 1 },
          targetAudience: { type: 'string', example: 'Developers and tech enthusiasts aged 25-45' },
          contentPillars: { type: 'string', example: 'Product updates, Industry insights, Developer tips' },
          postingSchedule: { type: 'string', example: 'Mon/Wed/Fri at 10am, Tue/Thu at 2pm' },
          platformStrategy: { type: 'string', example: 'Twitter for quick updates, LinkedIn for thought leadership' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      PaymentTransaction: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          userId: { type: 'integer', example: 1 },
          checkoutId: { type: 'string', example: '8ac7a4c99...', nullable: true },
          amount: { type: 'number', format: 'float', example: 99.99 },
          currency: { type: 'string', example: 'SAR' },
          status: { type: 'string', enum: ['pending', 'completed', 'failed', 'refunded'], example: 'completed' },
          plan: { type: 'string', enum: ['pro', 'business', 'enterprise'], example: 'pro' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      CreditTransaction: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          userId: { type: 'integer', example: 1 },
          amount: { type: 'integer', example: -10 },
          type: { type: 'string', enum: ['deduct', 'add', 'reset', 'purchase'], example: 'deduct' },
          reason: { type: 'string', example: 'Post published to X (Twitter)' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      EmailLog: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          to: { type: 'string', format: 'email', example: 'user@example.com' },
          subject: { type: 'string', example: 'Post Published Successfully' },
          type: { type: 'string', enum: ['post_published', 'credits_low', 'payment_success'], example: 'post_published' },
          status: { type: 'string', enum: ['sent', 'failed'], example: 'sent' },
          error: { type: 'string', nullable: true },
          sentAt: { type: 'string', format: 'date-time' }
        }
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Invalid request' },
          message: { type: 'string', example: 'Detailed error message' },
          code: { type: 'string', example: 'ERR_VALIDATION' }
        }
      },
      Success: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Operation successful' },
          data: { type: 'object' }
        }
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication token is missing or invalid',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { error: 'Unauthorized', message: 'Invalid or missing token' }
          }
        }
      },
      ForbiddenError: {
        description: 'User does not have permission to access this resource',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { error: 'Forbidden', message: 'Admin access required' }
          }
        }
      },
      NotFoundError: {
        description: 'The requested resource was not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { error: 'Not Found', message: 'Resource not found' }
          }
        }
      },
      ValidationError: {
        description: 'Request validation failed',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { error: 'Validation Error', message: 'Required fields are missing' }
          }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

export const swaggerOptions = {
  definition: swaggerDefinition,
  apis: ['./server.js', './services/*.js', './swagger.docs.js'], // Path to API docs
};
