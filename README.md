<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🚀 BrandPilot OS - AI-Powered Social Media Management Platform

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## 🎯 Overview

BrandPilot OS is a comprehensive AI-powered social media management platform that helps brands create, schedule, and optimize their social media presence across multiple platforms. Built with React, TypeScript, Node.js, and powered by Google's Gemini AI.

**View your app in AI Studio**: https://ai.studio/apps/drive/1C_G-0lIVwA1ptsFcO6QGNfwfV42XM4bV

---

## ✨ Key Features

### 🧬 Brand DNA Analysis
- AI-powered brand personality analysis
- Content strategy generation based on brand identity
- Audience targeting and engagement optimization

### 🎨 Content Creation
- AI-generated social media posts
- Custom image generation
- Platform-specific content optimization (Twitter/X, Instagram, Facebook)

### 💰 Monetization Intelligence
- AI-driven monetization strategy recommendations  
- Revenue opportunity analysis
- Business growth planning

### 📅 Smart Scheduling
- Advanced post scheduling system
- Automated publishing with agent-based background tasks
- Multi-platform content distribution

### 🔐 Enterprise Security
- **Complete Bearer token authentication**
- Role-based access control (Admin/User)
- Secure session management
- SHA-256 password encryption

### 📊 Analytics & Performance
- Real-time engagement tracking
- Performance analytics dashboard
- Credit usage monitoring
- Email notification system

---

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for lightning-fast development
- **Tailwind CSS** for responsive design
- **Lucide React** for consistent icons

### Backend  
- **Node.js** with Express server
- **Prisma ORM** with SQLite database
- **JWT-style Bearer token** authentication
- **Swagger/OpenAPI** documentation

### AI Integration
- **Google Gemini AI** for content generation
- **AI image generation** capabilities
- **Natural language processing** for brand analysis

### Social Platforms
- **Twitter/X API** integration
- **Facebook Graph API** support  
- **Instagram Business API** connectivity

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** 
- **npm** or **yarn**
- **Gemini API Key** (from Google AI Studio)

### 1. Installation
```bash
# Clone repository
git clone <repository-url>
cd brandpilot-os

# Install dependencies
npm install
```

### 2. Environment Setup
Create `.env.local` file:
```bash
# Required: Gemini AI API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Backend URL (defaults to localhost:3001)
VITE_BACKEND_API_URL=http://localhost:3001

# Database (SQLite file created automatically)
DATABASE_URL="file:./dev.db"
```

### 3. Database Setup
```bash
# Generate Prisma client and run migrations
npx prisma migrate dev
npx prisma generate

# Optional: Seed database with test data
node scripts/seedConfig.js
```

### 4. Start Development
```bash
# Start backend server (port 3001)
node server.js

# In another terminal, start frontend (port 5173)  
npm run dev
```

### 5. Access Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Swagger Docs**: http://localhost:3001/api-docs

---

## 📚 Documentation

### Core Guides
- [🔐 Authentication Guide](AUTHENTICATION_GUIDE.md) - Complete authentication implementation
- [📖 API Documentation](SWAGGER_API_DOCS.md) - Interactive Swagger/OpenAPI docs
- [🗄️ Database Schema](DATABASE_SCHEMA.md) - Database structure and relationships

### Feature Documentation  
- [🤖 Auto-Post Guide](AUTO_POST_GUIDE.md) - Automated posting system
- [💳 Payment Integration](PAYMENT_INTEGRATION_README.md) - Payment processing setup
- [💰 Credits System](CREDITS_SYSTEM_README.md) - Credit management system
- [📧 Email System](EMAIL_SETUP.md) - Email configuration and troubleshooting

### Advanced Setup
- [💳 HyperPay Setup](HYPERPAY_SETUP.md) - Payment gateway configuration
- [🔍 Plan Features](PLAN_FEATURES_VERIFICATION.md) - Subscription plan verification
- [📊 Email Logs](EMAIL_LOGS_README.md) - Email system monitoring

---

## 🏗️ Architecture Overview

### Authentication System
- **Secure Bearer Token** authentication with 7-day sessions
- **Role-based access** (Admin/User permissions)
- **Complete frontend coverage** - all components authenticated
- **Universal API protection** - all endpoints secured

### Backend Services
- **RESTful API** with comprehensive error handling
- **Prisma ORM** for type-safe database operations  
- **Modular service architecture** (auth, email, AI, payments)
- **Background task processing** for automated posting

### Frontend Architecture
- **Component-based React** with TypeScript
- **Centralized state management** for authentication
- **Service layer abstraction** for API calls
- **Responsive UI** with Tailwind CSS

---

## 🔐 Security Features

### Authentication & Authorization
- ✅ Bearer token authentication on all endpoints
- ✅ SHA-256 password hashing
- ✅ Session-based authorization with database storage
- ✅ Role-based access control (Admin/User)
- ✅ Automatic session expiry (7 days)
- ✅ Secure token validation on every request

### Data Protection
- ✅ SQL injection prevention via Prisma ORM
- ✅ Input validation and sanitization
- ✅ Error handling without information leakage
- ✅ Secure configuration management

---

## 📊 API Coverage

### Authentication Endpoints
- `POST /api/login` - User authentication
- `GET /api/me` - Get current user
- `POST /api/validate-token` - Validate session
- `POST /api/logout` - End session

### Content & AI Features  
- `POST /api/brand-dna` - Generate Brand DNA analysis
- `POST /api/content-strategy` - Create content strategy
- `POST /api/monetization-plan` - Generate monetization plan
- `POST /api/generate-post` - Create social media posts
- `POST /api/generate-image` - Generate AI images
- `POST /api/publish` - Publish to social platforms

### Management & Analytics
- `GET /api/users` - User management (Admin)
- `GET /api/posts/all` - Content overview  
- `GET /api/analytics/:userId` - Performance metrics
- `GET /api/payment/history` - Payment transactions

**Total**: 40+ secured API endpoints with full authentication

---

## 🚀 Deployment

### Production Checklist
- [ ] Update `VITE_BACKEND_API_URL` to production URL
- [ ] Set up HTTPS for secure token transmission
- [ ] Configure production database (PostgreSQL recommended)
- [ ] Set up proper environment variables
- [ ] Enable CORS for production domains
- [ ] Set up monitoring and logging

### Environment Variables
```bash
# Production .env
GEMINI_API_KEY=prod_gemini_key
DATABASE_URL=postgresql://user:pass@host:5432/brandpilot
NODE_ENV=production
PORT=3001
```

---

## 🤝 Development

### Project Structure
```
brandpilot-os/
├── components/          # React components
├── services/            # API service layer  
├── prisma/             # Database schema & migrations
├── scripts/            # Utility scripts
├── docs/               # Documentation
├── server.js           # Express backend server
└── App.tsx            # Main React application
```

### Development Commands
```bash
# Database operations
npx prisma migrate dev --name migration_name
npx prisma studio

# Testing
node scripts/testCompleteSystem.cjs
node scripts/checkUserPlan.js

# Production build
npm run build
```

---

## 📞 Support & Resources

### Getting Help
1. **Check Documentation** - Start with relevant `.md` files
2. **Swagger UI** - Test APIs at `/api-docs`  
3. **Database Studio** - View data with `npx prisma studio`
4. **Console Logs** - Check browser dev tools for frontend issues

### Common Issues
- **Authentication**: See [AUTHENTICATION_GUIDE.md](AUTHENTICATION_GUIDE.md)
- **Email Setup**: See [EMAIL_TROUBLESHOOTING.md](EMAIL_TROUBLESHOOTING.md)
- **Payment Issues**: See [HYPERPAY_TROUBLESHOOTING.md](HYPERPAY_TROUBLESHOOTING.md)

---

## 📄 License & Credits

Built with modern web technologies and powered by Google's Gemini AI. 

**Core Technologies:**
- React + TypeScript + Vite
- Node.js + Express + Prisma
- Google Gemini AI + OpenAPI
- Tailwind CSS + Lucide Icons

---

*Last Updated: January 17, 2026 - Complete authentication implementation with comprehensive security coverage*
