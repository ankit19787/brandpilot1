import React, { useState } from 'react';
import { Book, Zap, Shield, Rocket, CheckCircle, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';

const Documentation: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['api-docs', 'getting-started']));

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const isExpanded = (sectionId: string) => expandedSections.has(sectionId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-500/20">
              <Book className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                BrandPilot OS Documentation
              </h1>
              <p className="text-slate-600 mt-2">Complete guide to mastering your social media automation platform</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-indigo-100">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="text-yellow-500" size={24} />
              <h3 className="font-bold text-slate-800">Latest Updates</h3>
            </div>
            <p className="text-sm text-slate-600">User Management • Plan Credits • Platform Normalization • API Docs (Swagger)</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-100">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="text-green-500" size={24} />
              <h3 className="font-bold text-slate-800">Security First</h3>
            </div>
            <p className="text-sm text-slate-600">Encrypted passwords • Secure sessions • Role-based access control</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-100">
            <div className="flex items-center gap-3 mb-2">
              <Rocket className="text-purple-500" size={24} />
              <h3 className="font-bold text-slate-800">Production Ready</h3>
            </div>
            <p className="text-sm text-slate-600">Battle-tested • Scalable architecture • Enterprise features</p>
          </div>
        </div>

        {/* Recent Enhancements Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 mb-10 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Zap className="text-white" size={24} />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-3">🎉 Recent Enhancements</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <CheckCircle size={16} />
                    User Management System
                  </h3>
                  <p className="text-white/80 text-sm">Full CRUD operations with role and plan management. Business+ plan feature.</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <CheckCircle size={16} />
                    Plan-Based Credit System
                  </h3>
                  <p className="text-white/80 text-sm">Automatic credit allocation based on subscription tiers with smart upgrades.</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <CheckCircle size={16} />
                    Platform Normalization
                  </h3>
                  <p className="text-white/80 text-sm">Consistent platform naming across the entire application.</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <CheckCircle size={16} />
                    Dynamic Statistics
                  </h3>
                  <p className="text-white/80 text-sm">Platform Responses stats now filter based on selected criteria.</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <CheckCircle size={16} />
                    Interactive API Documentation
                  </h3>
                  <p className="text-white/80 text-sm">Full Swagger UI with live endpoint testing and authentication.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Sections */}
        <div className="space-y-4">
          
          {/* API Documentation Section - NEW */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <button
              onClick={() => toggleSection('api-docs')}
              className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isExpanded('api-docs') ? <ChevronDown className="text-indigo-600" size={24} /> : <ChevronRight className="text-slate-400" size={24} />}
                <h2 className="text-2xl font-bold text-slate-800">🚀 API Documentation (Swagger)</h2>
              </div>
            </button>
            {isExpanded('api-docs') && (
              <div className="px-6 pb-6 space-y-6">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
                  <h3 className="text-2xl font-bold mb-3">Interactive API Testing</h3>
                  <p className="mb-4 text-indigo-100">
                    BrandPilot OS includes full Swagger/OpenAPI documentation. Test all endpoints directly from your browser 
                    with live request/response examples and automatic authentication.
                  </p>
                  <a 
                    href="http://localhost:3001/api-docs" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white text-indigo-600 font-semibold px-6 py-3 rounded-lg hover:bg-indigo-50 transition-colors shadow-lg"
                  >
                    <ExternalLink size={18} />
                    Open Swagger UI
                  </a>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-indigo-700 mb-4">Quick Start Guide</h3>
                  <ol className="space-y-4">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">1</span>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800">Visit Swagger UI</p>
                        <p className="text-sm text-slate-600 mt-1">Navigate to <code className="bg-slate-100 px-2 py-1 rounded">http://localhost:3001/api-docs</code></p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">2</span>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800">Authenticate</p>
                        <p className="text-sm text-slate-600 mt-1">Click the "Authorize" button and enter your Bearer token</p>
                        <pre className="bg-slate-900 text-green-400 rounded-lg p-3 mt-2 text-xs overflow-x-auto">
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
                        </pre>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">3</span>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800">Test Endpoints</p>
                        <p className="text-sm text-slate-600 mt-1">
                          Expand any endpoint → Click "Try it out" → Fill parameters → Execute → View response
                        </p>
                      </div>
                    </li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-indigo-700 mb-4">Available API Categories</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-colors">
                      <h4 className="font-bold text-slate-800 mb-2">🔐 Authentication</h4>
                      <p className="text-sm text-slate-600">Login, token validation</p>
                    </div>
                    <div className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-colors">
                      <h4 className="font-bold text-slate-800 mb-2">👥 Users</h4>
                      <p className="text-sm text-slate-600">CRUD, credits, profiles</p>
                    </div>
                    <div className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-colors">
                      <h4 className="font-bold text-slate-800 mb-2">✍️ Posts</h4>
                      <p className="text-sm text-slate-600">Create, schedule, publish</p>
                    </div>
                    <div className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-colors">
                      <h4 className="font-bold text-slate-800 mb-2">🧬 Brand DNA</h4>
                      <p className="text-sm text-slate-600">AI brand analysis</p>
                    </div>
                    <div className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-colors">
                      <h4 className="font-bold text-slate-800 mb-2">🎯 Content Strategy</h4>
                      <p className="text-sm text-slate-600">AI strategy generation</p>
                    </div>
                    <div className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-colors">
                      <h4 className="font-bold text-slate-800 mb-2">🤖 AI Generation</h4>
                      <p className="text-sm text-slate-600">Content & image generation</p>
                    </div>
                    <div className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-colors">
                      <h4 className="font-bold text-slate-800 mb-2">💰 Payment</h4>
                      <p className="text-sm text-slate-600">HyperPay integration</p>
                    </div>
                    <div className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-colors">
                      <h4 className="font-bold text-slate-800 mb-2">📊 Analytics</h4>
                      <p className="text-sm text-slate-600">Performance metrics</p>
                    </div>
                    <div className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-colors">
                      <h4 className="font-bold text-slate-800 mb-2">⚙️ Configuration</h4>
                      <p className="text-sm text-slate-600">Platform credentials</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-xl">
                  <h4 className="font-bold text-yellow-900 mb-2">💡 Pro Tips for Using Swagger</h4>
                  <ul className="space-y-1 text-sm text-yellow-800">
                    <li>• Use the filter box to quickly find specific endpoints</li>
                    <li>• All request/response schemas are documented with examples</li>
                    <li>• Authentication persists across page refreshes (stored in browser)</li>
                    <li>• Download the OpenAPI spec: <code className="bg-yellow-100 px-2 py-1 rounded">http://localhost:3001/api-docs.json</code></li>
                    <li>• Check response status codes and error messages for debugging</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
          
          {/* Getting Started */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <button
              onClick={() => toggleSection('getting-started')}
              className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isExpanded('getting-started') ? <ChevronDown className="text-indigo-600" size={24} /> : <ChevronRight className="text-slate-400" size={24} />}
                <h2 className="text-2xl font-bold text-slate-800">Getting Started</h2>
              </div>
            </button>
            {isExpanded('getting-started') && (
              <div className="px-6 pb-6 space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-indigo-700 mb-4">Quick Setup</h3>
                  <ol className="space-y-4">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">1</span>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800">Clone and Install</p>
                        <pre className="bg-slate-900 text-slate-100 rounded-lg p-3 mt-2 overflow-x-auto text-sm">
git clone &lt;repo-url&gt; && cd brandpilot-os && npm install
                        </pre>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">2</span>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800">Configure Database</p>
                        <pre className="bg-slate-900 text-slate-100 rounded-lg p-3 mt-2 overflow-x-auto text-sm">
# Create .env.local with DATABASE_URL
echo 'DATABASE_URL="postgresql://user:pass@localhost:5432/brandpilot"' &gt; .env.local

# Run migrations and seed
npx prisma migrate dev
npx prisma db seed
                        </pre>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">3</span>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800">Configure Platform Credentials</p>
                        <p className="text-sm text-slate-600 mt-1 mb-2">Add your API keys to .env.local, then import to database:</p>
                        <pre className="bg-slate-900 text-slate-100 rounded-lg p-3 mt-2 overflow-x-auto text-sm">
# Import all credentials from .env.local to database
node scripts/storeEnvConfig.js

# OR configure specific services:
node scripts/configureEmail.js
node scripts/configureHyperPay.js
                        </pre>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">4</span>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800">Start Development Servers</p>
                        <pre className="bg-slate-900 text-slate-100 rounded-lg p-3 mt-2 overflow-x-auto text-sm">
npm run dev    # Frontend (Vite on port 5173)
node server.js # Backend (Express on port 3001)
                        </pre>
                      </div>
                    </li>
                  </ol>
                </div>
              </div>
            )}
          </div>

          {/* Core Features */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <button
              onClick={() => toggleSection('core-features')}
              className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isExpanded('core-features') ? <ChevronDown className="text-indigo-600" size={24} /> : <ChevronRight className="text-slate-400" size={24} />}
                <h2 className="text-2xl font-bold text-slate-800">Core Features</h2>
              </div>
            </button>
            {isExpanded('core-features') && (
              <div className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-slate-200 rounded-xl p-5">
                    <h3 className="font-bold text-lg text-slate-800 mb-3">📊 Dashboard</h3>
                    <ul className="space-y-2 text-sm text-slate-600">
                      <li>• Real-time analytics overview</li>
                      <li>• Post performance tracking</li>
                      <li>• Quick navigation to all features</li>
                      <li>• Credit usage visualization</li>
                    </ul>
                  </div>
                  
                  <div className="border border-slate-200 rounded-xl p-5">
                    <h3 className="font-bold text-lg text-slate-800 mb-3">🧬 Brand DNA (Pro+)</h3>
                    <ul className="space-y-2 text-sm text-slate-600">
                      <li>• Define brand identity and values</li>
                      <li>• Set tone of voice and personality</li>
                      <li>• Target audience profiling</li>
                      <li>• Persistent brand guidelines</li>
                    </ul>
                  </div>
                  
                  <div className="border border-slate-200 rounded-xl p-5">
                    <h3 className="font-bold text-lg text-slate-800 mb-3">🎯 AI Strategist (Pro+)</h3>
                    <ul className="space-y-2 text-sm text-slate-600">
                      <li>• AI-powered content strategy</li>
                      <li>• Platform-specific recommendations</li>
                      <li>• Optimal posting schedule</li>
                      <li>• Engagement optimization tips</li>
                    </ul>
                  </div>
                  
                  <div className="border border-slate-200 rounded-xl p-5">
                    <h3 className="font-bold text-lg text-slate-800 mb-3">✍️ Content Engine</h3>
                    <ul className="space-y-2 text-sm text-slate-600">
                      <li>• AI content generation</li>
                      <li>• Multi-platform posting</li>
                      <li>• Image upload & management</li>
                      <li>• Instant or scheduled publishing</li>
                    </ul>
                  </div>
                  
                  <div className="border border-slate-200 rounded-xl p-5">
                    <h3 className="font-bold text-lg text-slate-800 mb-3">📅 Content Calendar</h3>
                    <ul className="space-y-2 text-sm text-slate-600">
                      <li>• Visual calendar interface</li>
                      <li>• Scheduled post management</li>
                      <li>• Drag & drop rescheduling</li>
                      <li>• Monthly/weekly/daily views</li>
                    </ul>
                  </div>
                  
                  <div className="border border-slate-200 rounded-xl p-5">
                    <h3 className="font-bold text-lg text-slate-800 mb-3">🔗 Connections</h3>
                    <ul className="space-y-2 text-sm text-slate-600">
                      <li>• Connect social media accounts</li>
                      <li>• Platform health monitoring</li>
                      <li>• Test connection status</li>
                      <li>• One-click reconnection</li>
                    </ul>
                  </div>
                  
                  <div className="border border-slate-200 rounded-xl p-5">
                    <h3 className="font-bold text-lg text-slate-800 mb-3">📈 Performance Analytics</h3>
                    <ul className="space-y-2 text-sm text-slate-600">
                      <li>• Engagement metrics tracking</li>
                      <li>• Platform-specific insights</li>
                      <li>• Post performance comparison</li>
                      <li>• Growth trend analysis</li>
                    </ul>
                  </div>
                  
                  <div className="border border-slate-200 rounded-xl p-5">
                    <h3 className="font-bold text-lg text-slate-800 mb-3">💰 Monetization (Pro+)</h3>
                    <ul className="space-y-2 text-sm text-slate-600">
                      <li>• Plan upgrade options</li>
                      <li>• HyperPay payment integration</li>
                      <li>• Automatic credit provisioning</li>
                      <li>• Subscription management</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Admin Features */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <button
              onClick={() => toggleSection('admin-features')}
              className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isExpanded('admin-features') ? <ChevronDown className="text-indigo-600" size={24} /> : <ChevronRight className="text-slate-400" size={24} />}
                <h2 className="text-2xl font-bold text-slate-800">Admin Features (Business+)</h2>
              </div>
            </button>
            {isExpanded('admin-features') && (
              <div className="px-6 pb-6 space-y-6">
                <div className="bg-purple-50 border-l-4 border-purple-500 p-5 rounded-r-xl">
                  <h3 className="font-bold text-lg text-purple-900 mb-2">🔑 API Credentials Management</h3>
                  <p className="text-purple-800 text-sm mb-3">Securely store and manage API keys for all connected platforms.</p>
                  <ul className="space-y-1 text-sm text-purple-700 ml-4">
                    <li>• Database-encrypted credential storage</li>
                    <li>• Environment variable configuration</li>
                    <li>• Test and validate API connections</li>
                    <li>• Platform-specific configuration (X, Facebook, Instagram, Cloudinary, Gemini AI)</li>
                  </ul>
                </div>
                
                <div className="bg-indigo-50 border-l-4 border-indigo-500 p-5 rounded-r-xl">
                  <h3 className="font-bold text-lg text-indigo-900 mb-2">👥 User Management</h3>
                  <p className="text-indigo-800 text-sm mb-3">Complete user administration with role and plan management.</p>
                  <ul className="space-y-1 text-sm text-indigo-700 ml-4">
                    <li>• Create/Edit/Delete users with inline editing</li>
                    <li>• Role assignment (Admin/User)</li>
                    <li>• Plan management (Free/Pro/Business/Enterprise)</li>
                    <li>• Automatic credit allocation by plan:
                      <ul className="ml-6 mt-1">
                        <li>→ Free: 1,000 credits</li>
                        <li>→ Pro: 10,000 credits</li>
                        <li>→ Business: 50,000 credits</li>
                        <li>→ Enterprise: 100,000 credits</li>
                      </ul>
                    </li>
                    <li>• Smart credit management on plan changes:
                      <ul className="ml-6 mt-1">
                        <li>→ Upgrading: Full credits of new plan</li>
                        <li>→ Downgrading: Capped at new plan limit</li>
                      </ul>
                    </li>
                    <li>• Search and filter by username, role, or plan</li>
                    <li>• User statistics dashboard</li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-xl">
                  <h3 className="font-bold text-lg text-blue-900 mb-2">📱 Platform Responses</h3>
                  <p className="text-blue-800 text-sm mb-3">Monitor and track all social media platform responses and post statuses.</p>
                  <ul className="space-y-1 text-sm text-blue-700 ml-4">
                    <li>• Unified platform naming (X (Twitter), Facebook, Instagram)</li>
                    <li>• Dynamic statistics with real-time filtering</li>
                    <li>• Filter by platform and status (published/failed/scheduled)</li>
                    <li>• View platform responses, errors, and publishing attempts</li>
                    <li>• Track post IDs, timestamps, and user attribution</li>
                    <li>• Response detail expansion for debugging</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 border-l-4 border-green-500 p-5 rounded-r-xl">
                  <h3 className="font-bold text-lg text-green-900 mb-2">📧 Email System</h3>
                  <p className="text-green-800 text-sm mb-3">Complete email notification and logging system.</p>
                  <ul className="space-y-1 text-sm text-green-700 ml-4">
                    <li>• Automated email notifications for posts, credits, and events</li>
                    <li>• Complete audit trail via Email Logs</li>
                    <li>• Database-stored SMTP configuration</li>
                    <li>• Low credit alerts and warnings</li>
                    <li>• Post publishing confirmations</li>
                    <li>• Filter logs by type, status, and recipient</li>
                  </ul>
                </div>
                
                <div className="bg-orange-50 border-l-4 border-orange-500 p-5 rounded-r-xl">
                  <h3 className="font-bold text-lg text-orange-900 mb-2">⚙️ Admin Posts</h3>
                  <p className="text-orange-800 text-sm mb-3">Advanced post management and monitoring.</p>
                  <ul className="space-y-1 text-sm text-orange-700 ml-4">
                    <li>• View all posts across all users</li>
                    <li>• Detailed post status tracking</li>
                    <li>• Publishing attempt history</li>
                    <li>• Platform-specific error debugging</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
          {/* Subscription Plans */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <button
              onClick={() => toggleSection('subscription-plans')}
              className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isExpanded('subscription-plans') ? <ChevronDown className="text-indigo-600" size={24} /> : <ChevronRight className="text-slate-400" size={24} />}
                <h2 className="text-2xl font-bold text-slate-800">Subscription Plans</h2>
              </div>
            </button>
            {isExpanded('subscription-plans') && (
              <div className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="border-2 border-gray-200 rounded-2xl p-6 hover:border-gray-300 transition-colors">
                    <h3 className="font-bold text-xl text-gray-900 mb-2">Free</h3>
                    <div className="mb-4">
                      <p className="text-4xl font-bold text-indigo-600">1,000</p>
                      <p className="text-sm text-gray-600">credits/month</p>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" />Basic posting</li>
                      <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" />3 platforms</li>
                      <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" />Content Engine</li>
                      <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" />Manual scheduling</li>
                    </ul>
                  </div>
                  
                  <div className="border-2 border-blue-300 rounded-2xl p-6 bg-blue-50 hover:border-blue-400 transition-colors">
                    <h3 className="font-bold text-xl text-blue-900 mb-2">Pro</h3>
                    <div className="mb-4">
                      <p className="text-4xl font-bold text-blue-600">10,000</p>
                      <p className="text-sm text-blue-600">credits/month</p>
                    </div>
                    <ul className="space-y-2 text-sm text-blue-700">
                      <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" />All Free features</li>
                      <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" />Brand DNA</li>
                      <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" />AI Strategist</li>
                      <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" />Advanced analytics</li>
                    </ul>
                  </div>
                  
                  <div className="border-2 border-purple-300 rounded-2xl p-6 bg-purple-50 hover:border-purple-400 transition-colors relative">
                    <div className="absolute -top-3 right-4 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold">POPULAR</div>
                    <h3 className="font-bold text-xl text-purple-900 mb-2">Business</h3>
                    <div className="mb-4">
                      <p className="text-4xl font-bold text-purple-600">50,000</p>
                      <p className="text-sm text-purple-600">credits/month</p>
                    </div>
                    <ul className="space-y-2 text-sm text-purple-700">
                      <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" />All Pro features</li>
                      <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" />User management</li>
                      <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" />API credentials</li>
                      <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" />Email logs</li>
                      <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" />Platform responses</li>
                    </ul>
                  </div>
                  
                  <div className="border-2 border-indigo-300 rounded-2xl p-6 bg-gradient-to-br from-indigo-50 to-purple-50 hover:border-indigo-400 transition-colors">
                    <h3 className="font-bold text-xl text-indigo-900 mb-2">Enterprise</h3>
                    <div className="mb-4">
                      <p className="text-4xl font-bold text-indigo-600">100,000</p>
                      <p className="text-sm text-indigo-600">credits/month</p>
                    </div>
                    <ul className="space-y-2 text-sm text-indigo-700">
                      <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" />All Business features</li>
                      <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" />Priority support</li>
                      <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" />Custom integrations</li>
                      <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" />Dedicated account manager</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Platform Setup */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <button
              onClick={() => toggleSection('platform-setup')}
              className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isExpanded('platform-setup') ? <ChevronDown className="text-indigo-600" size={24} /> : <ChevronRight className="text-slate-400" size={24} />}
                <h2 className="text-2xl font-bold text-slate-800">Platform Setup & Credentials</h2>
              </div>
            </button>
            {isExpanded('platform-setup') && (
              <div className="px-6 pb-6">
                <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl">
                  <p className="text-blue-800 font-semibold">✨ Configuration Approaches:</p>
                  <ul className="mt-2 space-y-1 text-blue-700">
                    <li><strong>Option 1 (Recommended):</strong> Use the <strong>Credentials</strong> tab in Admin panel (Business+ plan) - No file editing needed!</li>
                    <li><strong>Option 2:</strong> Add credentials to .env.local and run <code className="bg-blue-100 px-2 py-1 rounded">node scripts/storeEnvConfig.js</code></li>
                    <li><strong>Option 3:</strong> Use specific configuration scripts (configureEmail.js, configureHyperPay.js, etc.)</li>
                  </ul>
                  <p className="mt-2 text-blue-800 text-sm">All credentials are stored securely in the database Config table.</p>
                </div>

                <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl">
                  <p className="text-blue-800 font-semibold">Supported Platforms:</p>
                  <ul className="mt-2 space-y-1 text-blue-700">
                    <li>• X (Twitter) - OAuth 1.0a API</li>
                    <li>• Facebook - Graph API</li>
                    <li>• Instagram - Graph API (Business accounts)</li>
                    <li>• LinkedIn - Coming soon</li>
                  </ul>
                </div>

                <div className="space-y-6">
                  <div className="border border-slate-200 rounded-xl p-5">
                    <h3 className="font-bold text-lg text-slate-800 mb-3 flex items-center gap-2">
                      <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">𝕏</span>
                      X (Twitter) Setup
                    </h3>
                    <ol className="space-y-2 text-sm text-slate-600 ml-4">
                      <li>1. Go to <a href="https://developer.twitter.com/" className="text-indigo-600 underline inline-flex items-center gap-1" target="_blank">developer.twitter.com <ExternalLink size={12} /></a></li>
                      <li>2. Create a new Twitter Developer App</li>
                      <li>3. Generate API Key, API Secret, Access Token, and Access Secret</li>
                      <li>4. Store credentials in database using Credentials tab (Admin panel)</li>
                      <li>5. Or use seed script to import from <code className="bg-slate-100 px-2 py-1 rounded">.env.local</code>:</li>
                    </ol>
                    <pre className="bg-slate-900 text-green-400 rounded-lg p-3 mt-3 text-xs overflow-x-auto">
# First add to .env.local
VITE_X_API_KEY=your_api_key_here
VITE_X_API_SECRET=your_api_secret_here
VITE_X_ACCESS_TOKEN=your_access_token_here
VITE_X_ACCESS_SECRET=your_access_secret_here

# Then run seed script to store in database
node scripts/storeEnvConfig.js
                    </pre>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-5">
                    <h3 className="font-bold text-lg text-slate-800 mb-3 flex items-center gap-2">
                      <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">f</span>
                      Facebook Setup
                    </h3>
                    <ol className="space-y-2 text-sm text-slate-600 ml-4">
                      <li>1. Create a Facebook App in the <a href="https://developers.facebook.com/" className="text-indigo-600 underline inline-flex items-center gap-1" target="_blank">Facebook Developer Console <ExternalLink size={12} /></a></li>
                      <li>2. Get a Page Access Token with <code className="bg-slate-100 px-2 py-1 rounded">pages_manage_posts</code> and <code className="bg-slate-100 px-2 py-1 rounded">pages_read_engagement</code> permissions</li>
                      <li>3. Store in database via Credentials tab or seed script:</li>
                    </ol>
                    <pre className="bg-slate-900 text-green-400 rounded-lg p-3 mt-3 text-xs overflow-x-auto">
# Add to .env.local
VITE_FACEBOOK_PRODUCTION_TOKEN=your_page_access_token_here

# Import to database
node scripts/storeEnvConfig.js
                    </pre>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-5">
                    <h3 className="font-bold text-lg text-slate-800 mb-3 flex items-center gap-2">
                      <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-lg flex items-center justify-center text-sm font-bold">📷</span>
                      Instagram Setup
                    </h3>
                    <ol className="space-y-2 text-sm text-slate-600 ml-4">
                      <li>1. Connect your Instagram Business Account to a Facebook Page</li>
                      <li>2. Get an Instagram Graph API token (same as Facebook token if linked)</li>
                      <li>3. Store in database via Credentials tab or seed script:</li>
                    </ol>
                    <pre className="bg-slate-900 text-green-400 rounded-lg p-3 mt-3 text-xs overflow-x-auto">
# Add to .env.local
VITE_INSTAGRAM_WA_TOKEN=your_instagram_token_here

# Import to database
node scripts/storeEnvConfig.js
                    </pre>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-5">
                    <h3 className="font-bold text-lg text-slate-800 mb-3 flex items-center gap-2">
                      <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center text-sm font-bold">☁️</span>
                      Cloudinary (Image Hosting)
                    </h3>
                    <ol className="space-y-2 text-sm text-slate-600 ml-4">
                      <li>1. Sign up at <a href="https://cloudinary.com/" className="text-indigo-600 underline inline-flex items-center gap-1" target="_blank">cloudinary.com <ExternalLink size={12} /></a></li>
                      <li>2. Get your Cloud Name, API Key, and API Secret from the dashboard</li>
                      <li>3. Store in database via Credentials tab or seed script:</li>
                    </ol>
                    <pre className="bg-slate-900 text-green-400 rounded-lg p-3 mt-3 text-xs overflow-x-auto">
# Add to .env.local
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
VITE_CLOUDINARY_API_KEY=your_api_key_here
VITE_CLOUDINARY_API_SECRET=your_api_secret_here

# Import to database
node scripts/storeEnvConfig.js
                    </pre>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-5">
                    <h3 className="font-bold text-lg text-slate-800 mb-3 flex items-center gap-2">
                      <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-lg flex items-center justify-center text-sm font-bold">✨</span>
                      Google Gemini AI
                    </h3>
                    <ol className="space-y-2 text-sm text-slate-600 ml-4">
                      <li>1. Get API key from <a href="https://makersuite.google.com/app/apikey" className="text-indigo-600 underline inline-flex items-center gap-1" target="_blank">Google AI Studio <ExternalLink size={12} /></a></li>
                      <li>2. Store in database via Credentials tab or seed script:</li>
                    </ol>
                    <pre className="bg-slate-900 text-green-400 rounded-lg p-3 mt-3 text-xs overflow-x-auto">
# Add to .env.local as VITE_API_KEY or VITE_GEMINI_API_KEY
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Import to database (stored as 'gemini_api_key')
node scripts/storeEnvConfig.js
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Technical Documentation */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <button
              onClick={() => toggleSection('technical-docs')}
              className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isExpanded('technical-docs') ? <ChevronDown className="text-indigo-600" size={24} /> : <ChevronRight className="text-slate-400" size={24} />}
                <h2 className="text-2xl font-bold text-slate-800">Technical Documentation</h2>
              </div>
            </button>
            {isExpanded('technical-docs') && (
              <div className="px-6 pb-6 space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-indigo-700 mb-4">Technology Stack</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-slate-200 rounded-lg p-4">
                      <h4 className="font-bold text-slate-800 mb-2">Frontend</h4>
                      <ul className="space-y-1 text-sm text-slate-600">
                        <li>• React 18 with TypeScript</li>
                        <li>• Vite (dev server port 5173)</li>
                        <li>• TailwindCSS for styling</li>
                        <li>• Lucide React for icons</li>
                      </ul>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-4">
                      <h4 className="font-bold text-slate-800 mb-2">Backend</h4>
                      <ul className="space-y-1 text-sm text-slate-600">
                        <li>• Node.js + Express (port 3001)</li>
                        <li>• PostgreSQL database</li>
                        <li>• Prisma ORM</li>
                        <li>• Crypto for password hashing</li>
                      </ul>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-4">
                      <h4 className="font-bold text-slate-800 mb-2">Integrations</h4>
                      <ul className="space-y-1 text-sm text-slate-600">
                        <li>• Google Gemini AI (content generation)</li>
                        <li>• Cloudinary (image hosting)</li>
                        <li>• HyperPay (payment processing)</li>
                        <li>• Nodemailer (email notifications)</li>
                      </ul>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-4">
                      <h4 className="font-bold text-slate-800 mb-2">APIs</h4>
                      <ul className="space-y-1 text-sm text-slate-600">
                        <li>• Facebook Graph API</li>
                        <li>• Twitter OAuth 1.0a API</li>
                        <li>• Instagram Graph API</li>
                        <li>• RESTful backend API</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-indigo-700 mb-4">API Endpoints</h3>
                  
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500 p-5 rounded-r-xl mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Rocket className="text-indigo-600" size={24} />
                      <h4 className="font-bold text-indigo-900 text-lg">Interactive API Documentation</h4>
                    </div>
                    <p className="text-indigo-800 mb-4">
                      Full API documentation with live testing is available via Swagger UI. 
                      You can explore all endpoints, view request/response schemas, and test APIs directly from your browser!
                    </p>
                    <a 
                      href="http://localhost:3001/api-docs" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors shadow-lg hover:shadow-xl"
                    >
                      <ExternalLink size={18} />
                      Open API Documentation (Swagger)
                    </a>
                    <p className="text-sm text-indigo-700 mt-3">
                      💡 <strong>Pro Tip:</strong> Use the "Authorize" button in Swagger to add your Bearer token and test authenticated endpoints!
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="font-bold text-slate-800 mb-3">User Management</h4>
                      <div className="space-y-2 text-sm font-mono">
                        <div className="flex items-center gap-3">
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-bold text-xs">GET</span>
                          <span className="text-slate-600">/api/users</span>
                          <span className="text-slate-400">- Fetch all users with post counts</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold text-xs">POST</span>
                          <span className="text-slate-600">/api/users</span>
                          <span className="text-slate-400">- Create new user with plan-based credits</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-bold text-xs">PATCH</span>
                          <span className="text-slate-600">/api/users/:userId</span>
                          <span className="text-slate-400">- Update user with automatic credit adjustment</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded font-bold text-xs">DELETE</span>
                          <span className="text-slate-600">/api/users/:userId</span>
                          <span className="text-slate-400">- Remove user and related data</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="font-bold text-slate-800 mb-3">Posts & Content</h4>
                      <div className="space-y-2 text-sm font-mono">
                        <div className="flex items-center gap-3">
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-bold text-xs">GET</span>
                          <span className="text-slate-600">/api/posts/all</span>
                          <span className="text-slate-400">- Fetch all posts with platform responses</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold text-xs">POST</span>
                          <span className="text-slate-600">/api/posts</span>
                          <span className="text-slate-400">- Create and schedule posts</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-bold text-xs">GET</span>
                          <span className="text-slate-600">/api/posts/scheduled</span>
                          <span className="text-slate-400">- Get scheduled posts</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="font-bold text-slate-800 mb-3">Payments (HyperPay)</h4>
                      <div className="space-y-2 text-sm font-mono">
                        <div className="flex items-center gap-3">
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold text-xs">POST</span>
                          <span className="text-slate-600">/api/payment/checkout</span>
                          <span className="text-slate-400">- Initiate payment checkout</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-bold text-xs">GET</span>
                          <span className="text-slate-600">/api/payment/status/:checkoutId</span>
                          <span className="text-slate-400">- Check payment status</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-bold text-xs">GET</span>
                          <span className="text-slate-600">/api/payment/history</span>
                          <span className="text-slate-400">- View transaction history</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-indigo-700 mb-4">Configuration System</h3>
                  <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-xl mb-4">
                    <p className="text-indigo-900 font-semibold mb-2">✨ Database-Driven Configuration</p>
                    <p className="text-indigo-800 text-sm">BrandPilot OS stores all configuration in the database Config table. This allows hot-reloading, environment-specific configs, and admin UI management.</p>
                  </div>
                  
                  <h4 className="font-bold text-slate-800 mb-3 mt-6">Initial Setup (.env.local)</h4>
                  <pre className="bg-slate-900 text-green-400 rounded-lg p-4 text-xs overflow-x-auto">
{`# Required for initial setup only
DATABASE_URL="postgresql://user:password@localhost:5432/brandpilot"
VITE_BACKEND_API_URL="http://localhost:3001"

# Platform Credentials (optional - can be added via Admin UI)
VITE_X_API_KEY="your_twitter_api_key"
VITE_X_API_SECRET="your_twitter_api_secret"
VITE_X_ACCESS_TOKEN="your_twitter_access_token"
VITE_X_ACCESS_SECRET="your_twitter_access_secret"
VITE_FACEBOOK_PRODUCTION_TOKEN="your_facebook_token"
VITE_INSTAGRAM_WA_TOKEN="your_instagram_token"
VITE_CLOUDINARY_CLOUD_NAME="your_cloud_name"
VITE_CLOUDINARY_API_KEY="your_cloudinary_key"
VITE_CLOUDINARY_API_SECRET="your_cloudinary_secret"
VITE_GEMINI_API_KEY="your_gemini_key"`}
                  </pre>
                  
                  <h4 className="font-bold text-slate-800 mb-3 mt-6">Import to Database</h4>
                  <pre className="bg-slate-900 text-green-400 rounded-lg p-4 text-xs overflow-x-auto">
{`# Import all credentials from .env.local to database
node scripts/storeEnvConfig.js

# Or use specific config scripts:
node scripts/configureEmail.js smtp.gmail.com 587 false user@gmail.com password
node scripts/configureHyperPay.js

# Verify configuration
node scripts/checkTwitterConfig.js
node scripts/checkEmailConfig.js
node scripts/checkHyperPayConfig.js`}
                  </pre>
                  
                  <h4 className="font-bold text-slate-800 mb-3 mt-6">Configuration via Admin UI</h4>
                  <p className="text-sm text-slate-600 mb-2">Business+ users can manage all credentials directly in the <strong>Credentials</strong> tab without touching files.</p>
                </div>
              </div>
            )}
          </div>

          {/* Best Practices & Tips */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <button
              onClick={() => toggleSection('best-practices')}
              className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isExpanded('best-practices') ? <ChevronDown className="text-indigo-600" size={24} /> : <ChevronRight className="text-slate-400" size={24} />}
                <h2 className="text-2xl font-bold text-slate-800">Best Practices & Troubleshooting</h2>
              </div>
            </button>
            {isExpanded('best-practices') && (
              <div className="px-6 pb-6 space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-green-700 mb-4">✅ Best Practices</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl">
                      <h4 className="font-bold text-green-900 mb-2">🔒 Security</h4>
                      <ul className="space-y-1 text-sm text-green-800">
                        <li>• Never expose API keys in frontend code</li>
                        <li>• Use backend proxy endpoints for sensitive operations</li>
                        <li>• Limit admin access to trusted users only</li>
                        <li>• Regularly rotate API credentials</li>
                      </ul>
                    </div>
                    
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl">
                      <h4 className="font-bold text-blue-900 mb-2">💳 Credit Management</h4>
                      <ul className="space-y-1 text-sm text-blue-800">
                        <li>• Monitor credit usage regularly</li>
                        <li>• Credits cannot exceed plan limits</li>
                        <li>• Upgrade plan to increase capacity</li>
                        <li>• Set up low credit email alerts</li>
                      </ul>
                    </div>
                    
                    <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-xl">
                      <h4 className="font-bold text-purple-900 mb-2">📅 Scheduling</h4>
                      <ul className="space-y-1 text-sm text-purple-800">
                        <li>• Schedule posts at least 1 minute in the future</li>
                        <li>• Use Content Calendar for visual planning</li>
                        <li>• Consider platform posting limits</li>
                        <li>• Test with immediate posts first</li>
                      </ul>
                    </div>
                    
                    <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-xl">
                      <h4 className="font-bold text-orange-900 mb-2">🖼️ Images & Media</h4>
                      <ul className="space-y-1 text-sm text-orange-800">
                        <li>• Optimize images before upload</li>
                        <li>• Respect platform image size limits</li>
                        <li>• Monitor Cloudinary quota usage</li>
                        <li>• Use appropriate image formats (JPG, PNG)</li>
                      </ul>
                    </div>
                    
                    <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-xl">
                      <h4 className="font-bold text-indigo-900 mb-2">🗄️ Database</h4>
                      <ul className="space-y-1 text-sm text-indigo-800">
                        <li>• Run migrations after schema changes</li>
                        <li>• Regularly backup your database</li>
                        <li>• Use test scripts to verify setup</li>
                        <li>• Monitor database performance</li>
                      </ul>
                    </div>
                    
                    <div className="bg-pink-50 border-l-4 border-pink-500 p-4 rounded-r-xl">
                      <h4 className="font-bold text-pink-900 mb-2">📧 Email System</h4>
                      <ul className="space-y-1 text-sm text-pink-800">
                        <li>• Test SMTP settings before production</li>
                        <li>• Configure email templates properly</li>
                        <li>• Monitor Email Logs for failures</li>
                        <li>• Use verified sender domains</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-red-700 mb-4">🔧 Troubleshooting</h3>
                  <div className="space-y-3">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="font-bold text-slate-800 mb-2">Server not starting?</h4>
                      <ul className="space-y-1 text-sm text-slate-600 ml-4">
                        <li>• Check if port 3001 is already in use</li>
                        <li>• Verify DATABASE_URL is correct</li>
                        <li>• Run <code className="bg-slate-200 px-2 py-1 rounded">node -c server.js</code> to check syntax</li>
                        <li>• Restart after environment variable changes</li>
                      </ul>
                    </div>
                    
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="font-bold text-slate-800 mb-2">Posts not publishing?</h4>
                      <ul className="space-y-1 text-sm text-slate-600 ml-4">
                        <li>• Check platform credentials in Connections tab</li>
                        <li>• Verify Platform Responses for error details</li>
                        <li>• Ensure sufficient credits available</li>
                        <li>• Check browser console and backend logs</li>
                      </ul>
                    </div>
                    
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="font-bold text-slate-800 mb-2">Platform filter showing duplicates?</h4>
                      <ul className="space-y-1 text-sm text-slate-600 ml-4">
                        <li>• System automatically normalizes platform names</li>
                        <li>• Run <code className="bg-slate-200 px-2 py-1 rounded">node scripts/normalizePlatformNames.cjs</code> to clean existing data</li>
                        <li>• Frontend and backend both normalize on read/write</li>
                      </ul>
                    </div>
                    
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="font-bold text-slate-800 mb-2">Credits not updating?</h4>
                      <ul className="space-y-1 text-sm text-slate-600 ml-4">
                        <li>• Credits are tied to subscription plans</li>
                        <li>• Cannot manually exceed plan limits</li>
                        <li>• Upgrade plan to increase maxCredits</li>
                        <li>• Check Credit Transaction history</li>
                      </ul>
                    </div>
                    
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="font-bold text-slate-800 mb-2">User creation failing?</h4>
                      <ul className="space-y-1 text-sm text-slate-600 ml-4">
                        <li>• Username and password are required fields</li>
                        <li>• Check for duplicate usernames</li>
                        <li>• Ensure Vite dev server proxy is active</li>
                        <li>• Restart Vite dev server if needed</li>
                      </ul>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="font-bold text-slate-800 mb-2">Database migration issues?</h4>
                      <ul className="space-y-1 text-sm text-slate-600 ml-4">
                        <li>• Run <code className="bg-slate-200 px-2 py-1 rounded">npx prisma migrate dev</code> after schema changes</li>
                        <li>• Use <code className="bg-slate-200 px-2 py-1 rounded">npx prisma migrate status</code> to check migration state</li>
                        <li>• Reset with <code className="bg-slate-200 px-2 py-1 rounded">npx prisma migrate reset</code> (dev only!)</li>
                        <li>• Generate client: <code className="bg-slate-200 px-2 py-1 rounded">npx prisma generate</code></li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 p-5 rounded-r-xl">
                  <h4 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
                    💡 Pro Tips
                  </h4>
                  <ul className="space-y-2 text-sm text-yellow-800">
                    <li>• Use test scripts in <code className="bg-yellow-100 px-2 py-1 rounded">/scripts</code> folder to verify configurations</li>
                    <li>• Platform Responses statistics update dynamically when filters are applied</li>
                    <li>• Email notifications provide real-time updates on post publishing and credit usage</li>
                    <li>• Admin Posts view shows all system activity across all users</li>
                    <li>• Use Brand DNA to maintain consistent brand voice across all content</li>
                    <li>• AI Strategist provides platform-specific optimization recommendations</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-white rounded-2xl shadow-sm border border-slate-200 px-8 py-6">
            <p className="text-slate-600 mb-2">Need help? Have questions?</p>
            <p className="text-sm text-slate-500">Check the test scripts in <code className="bg-slate-100 px-2 py-1 rounded">/scripts</code> directory</p>
            <p className="text-sm text-slate-500 mt-1">or review Platform Responses tab for detailed error logs</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
