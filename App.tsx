import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import BrandDNA from './components/BrandDNA';
import ContentStrategist from './components/ContentStrategist';
import ContentEngine from './components/ContentEngine';
import CalendarView from './components/CalendarView';
import PerformanceBrain from './components/PerformanceBrain';
import Monetization from './components/Monetization';
import Connections from './components/Connections';
import Credentials from './components/Credentials';
import Documentation from './components/Documentation';
import PaymentHistory from './components/PaymentHistory';
import Credits from './components/Credits';
import Profile from './components/Profile';
import EmailLogs from './components/EmailLogs';
import PlatformResponses from './components/PlatformResponses';
import AdminLogin from './components/AdminLogin';
import AdminPosts from './components/AdminPosts';
import APIConnectionTest from './components/APIConnectionTest';
import { ActiveTab, BrandDNA as BrandDNAType, ContentItem } from './types';
import { Sparkles, Bell, Search, X, CheckCircle, Zap } from 'lucide-react';
import { publishToPlatform, createPost, getUserPosts } from './services/gemini.client';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [dna, setDna] = useState<BrandDNAType | null>(null);
  const [draftTopic, setDraftTopic] = useState<string>('');
  const [scheduledPosts, setScheduledPosts] = useState<ContentItem[]>([]);
  const [toasts, setToasts] = useState<{id: number, message: string, type: 'success' | 'info'}[]>([]);
  const [autoPost, setAutoPost] = useState<boolean>(false);
  const [processingPosts, setProcessingPosts] = useState<Set<string>>(new Set());
  const processingPostsRef = React.useRef<Set<string>>(new Set()); // Use ref to prevent stale closure issues
  const [auth, setAuth] = useState<{ token: string; role: string } | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [userPlan, setUserPlan] = useState<{ plan: string; credits: number; maxCredits: number }>({
    plan: 'pro',
    credits: 7500,
    maxCredits: 10000
  });
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  const handleCreditsUpdate = (newCredits: number) => {
    setUserPlan(prev => ({ ...prev, credits: newCredits }));
  };

  const handlePlanUpgrade = (newPlan: string, credits: number, maxCredits: number) => {
    setUserPlan({ plan: newPlan, credits, maxCredits });
  };

  const handleOpenPlanModal = () => {
    setIsPlanModalOpen(true);
  };

  const addToast = (message: string, type: 'success' | 'info' = 'info') => {
    if (!message) return;
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Clean up old payment URLs on app load (before any component processing)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentId = urlParams.get('id');
    
    if (paymentId) {
      // Check if this payment was already processed
      const processedPayments = JSON.parse(localStorage.getItem('processed_payments') || '{}');
      
      if (processedPayments[paymentId]) {
        // Already processed, clean URL immediately
        console.log('Cleaning up processed payment URL:', paymentId);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      // If not processed, let PlanModal handle it
    }
  }, []); // Run only once on mount

  // Restore session on app load
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedAuth = localStorage.getItem('brandpilot_auth');
        if (storedAuth) {
          const authData = JSON.parse(storedAuth);
          
          // Validate the token with the server
          const backendUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001';
          const response = await fetch(`${backendUrl}/api/validate-token`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authData.token}`
            }
          });

          if (response.ok) {
            const validationData = await response.json();
            
            // Update auth with userId from validation
            const enrichedAuth = {
              ...authData,
              userId: validationData.user.id,
              username: validationData.user.username,
              role: validationData.user.role,
              plan: validationData.user.plan,
              credits: validationData.user.credits,
              maxCredits: validationData.user.maxCredits,
              avatarStyle: validationData.user.avatarStyle || '6366f1'
            };
            
            setAuth(enrichedAuth);
            setUserPlan({
              plan: validationData.user.plan,
              credits: validationData.user.credits,
              maxCredits: validationData.user.maxCredits
            });
            
            // Update localStorage with complete data
            localStorage.setItem('brandpilot_auth', JSON.stringify(enrichedAuth));
            
            addToast('Session restored successfully', 'success');
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('brandpilot_auth');
          }
        }
      } catch (error) {
        console.error('Session restoration failed:', error);
        localStorage.removeItem('brandpilot_auth');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    restoreSession();
  }, []);

  // Save auth to localStorage whenever it changes
  useEffect(() => {
    if (auth) {
      localStorage.setItem('brandpilot_auth', JSON.stringify(auth));
    } else {
      localStorage.removeItem('brandpilot_auth');
    }
  }, [auth]);

  // Periodic token validation (check every 5 minutes)
  useEffect(() => {
    if (!auth) return;

    const validateToken = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/validate-token`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.token}`
          }
        });

        if (response.ok) {
          const validationData = await response.json();
          
          // Update user plan from validation if available
          if (validationData.user) {
            setUserPlan({
              plan: validationData.user.plan,
              credits: validationData.user.credits,
              maxCredits: validationData.user.maxCredits
            });
          }
        } else {
          // Token is invalid or expired
          localStorage.removeItem('brandpilot_auth');
          setAuth(null);
          addToast('Session expired. Please login again.', 'info');
        }
      } catch (error) {
        console.error('Token validation error:', error);
      }
    };

    // Validate immediately
    validateToken();

    // Then validate every 5 minutes
    const interval = setInterval(validateToken, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [auth]);

  // Fetch user's scheduled posts on mount
  useEffect(() => {
    const fetchScheduledPosts = async () => {
      if (auth?.userId) {
        try {
          const posts = await getUserPosts(auth.userId);
          // Filter only scheduled posts
          const scheduled = posts.filter((p: any) => p.status === 'scheduled').map((p: any) => ({
            id: p.id,
            platform: p.platform,
            content: p.content,
            imageUrl: p.imageUrl || undefined,
            status: 'Scheduled',
            scheduledFor: p.scheduledFor,
            createdAt: p.createdAt
          }));
          setScheduledPosts(scheduled);
          console.log('Loaded scheduled posts:', scheduled.length);
        } catch (error) {
          console.error('Error fetching scheduled posts:', error);
        }
      }
    };
    
    fetchScheduledPosts();
  }, [auth?.userId]);

  // Load auto-post setting from database
  useEffect(() => {
    const loadAutoPostSetting = async () => {
      try {
        const response = await fetch('/api/config/auto_post_enabled');
        if (response.ok) {
          const data = await response.json();
          const isEnabled = data.value === 'true';
          setAutoPost(isEnabled);
          console.log('Auto-post setting loaded:', isEnabled);
        }
      } catch (error) {
        console.error('Error loading auto-post setting:', error);
      }
    };
    
    loadAutoPostSetting();
  }, []);

  // Simulated Agentic Background Worker
  useEffect(() => {
    if (!autoPost) {
      console.log('[Agent] Auto-post is disabled');
      return;
    }

    if (!auth?.userId) {
      console.log('[Agent] No user ID available, auto-post monitoring paused');
      return;
    }

    console.log('[Agent] Auto-post monitoring enabled, checking every 5 seconds');
    const interval = setInterval(async () => {
      const now = new Date();
      console.log(`[Agent] Checking for due posts... Current time: ${now.toISOString()}`);
      
      try {
        // Fetch fresh scheduled posts from database - ONLY get 'scheduled' status posts
        const posts = await getUserPosts(auth.userId);
        const scheduled = posts.filter((p: any) => p.status === 'scheduled'); // Changed: only get 'scheduled', not 'publishing'
        
        console.log(`[Agent] Total scheduled posts: ${scheduled.length}`);
        
        const duePosts = scheduled.filter((post: any) => {
          const scheduledTime = new Date(post.scheduledFor);
          const isDue = scheduledTime <= now;
          const isNotProcessing = !processingPostsRef.current.has(post.id); // Use ref instead of state
          const isScheduledStatus = post.status === 'scheduled'; // ONLY process posts with 'scheduled' status
          if (post.status === 'scheduled') {
            console.log(`[Agent] Post ${post.id}: scheduled for ${scheduledTime.toISOString()}, due: ${isDue}, processing: ${!isNotProcessing}, ref has: ${processingPostsRef.current.has(post.id)}`);
          }
          // Triple check: must be scheduled status, must be due, must not be processing
          return isDue && isNotProcessing && isScheduledStatus;
        });

        if (duePosts.length > 0) {
          console.log(`[Agent] Found ${duePosts.length} due posts, publishing...`);
          
          for (const post of duePosts) {
            // Check one more time if already processing (double-check)
            if (processingPostsRef.current.has(post.id)) {
              console.log(`[Agent] ⚠️ Post ${post.id} already being processed, skipping...`);
              continue;
            }
            
            // IMMEDIATELY add to ref to block other checks
            processingPostsRef.current.add(post.id);
            
            try {
              console.log(`[Agent] Auto-publishing due post: ${post.id} to ${post.platform}`);
              
              // IMMEDIATELY mark post as 'publishing' in database to prevent duplicate attempts
              await fetch(`/api/posts/${post.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  status: 'publishing', 
                  publishAttempts: (post.publishAttempts || 0) + 1,
                  lastPublishAttempt: new Date().toISOString() 
                })
              });
              
              // THEN mark as processing in local state
              setProcessingPosts(prev => new Set([...prev, post.id]));
              
              // Use the provided imageUrl directly - don't generate fallback
              const imageUrl = post.imageUrl;
              
              // Only Instagram requires an image, Facebook allows text-only posts
              if (post.platform === 'Instagram' && !imageUrl) {
                console.warn(`[Agent] No image URL provided for Instagram post. Instagram requires images.`);
                addToast(`Instagram post requires an image. Skipping post: ${post.id}`);
                // Mark as failed in database with error details
                await fetch(`/api/posts/${post.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    status: 'failed',
                    platformError: 'Instagram posts require an image URL',
                    publishAttempts: (post.publishAttempts || 0) + 1,
                    lastPublishAttempt: new Date().toISOString()
                  })
                });
                setScheduledPosts(prev => prev.map(p => 
                  p.id === post.id ? { ...p, status: 'Failed' as const } : p
                ));
                continue;
              }
              
              console.log(`[Agent] Publishing to ${post.platform}...`);
              
              // Publish to platform (database status already set to 'publishing' above)
              const result = await publishToPlatform(post.platform, post.content, { 
                imageUrl: imageUrl || undefined,
                userId: auth.userId
              });
              
              // Update database status with platform response data
              await fetch(`/api/posts/${post.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  status: 'published', 
                  publishedAt: new Date().toISOString(),
                  platformPostId: result.platformResponse?.platformPostId || result.id,
                  platformResponse: result.platformResponse ? JSON.stringify(result.platformResponse) : null
                })
              });
              
              
              console.log(`[Agent] ✅ Successfully published post ${post.id}`);
              addToast(`Agent successfully published scheduled post to ${post.platform}!`, 'success');
              
              // Remove from processing ref and state after successful publish
              processingPostsRef.current.delete(post.id);
              setProcessingPosts(prev => {
                const newSet = new Set(prev);
                newSet.delete(post.id);
                return newSet;
              });
            } catch (error: any) {
              const errorMsg = error?.message || "Background Task Error";
              console.error(`[Agent] ❌ Auto-post error for ${post.id}:`, error);
              
              // Update database to failed status with error details
              await fetch(`/api/posts/${post.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  status: 'failed',
                  platformError: errorMsg,
                  publishAttempts: (post.publishAttempts || 0) + 1,
                  lastPublishAttempt: new Date().toISOString()
                })
              });
              addToast(`Auto-post failed: ${errorMsg}`);
              
              // Remove from processing ref and state after failure
              processingPostsRef.current.delete(post.id);
              setProcessingPosts(prev => {
                const newSet = new Set(prev);
                newSet.delete(post.id);
                return newSet;
              });
            }
          }
        }
      } catch (error) {
        console.error('[Agent] Error checking for due posts:', error);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [autoPost, auth?.userId]);

  const navigateWithTopic = (tab: ActiveTab, topic: string) => {
    setDraftTopic(topic);
    setActiveTab(tab);
  };

  const handleSchedulePost = async (post: ContentItem) => {
    try {
      if (!auth?.userId) {
        console.error('No user ID available for scheduling post');
        addToast('Please log in to schedule posts', 'info');
        return;
      }
      
      // Save to database
      const savedPost = await createPost({
        userId: auth.userId,
        platform: post.platform,
        content: post.content,
        imageUrl: post.imageUrl,
        status: 'scheduled',
        scheduledFor: new Date(post.scheduledFor)
      });
      
      // Update local state
      setScheduledPosts(prev => [...prev, {
        ...post,
        id: savedPost.id
      }]);
      
      console.log('Post scheduled successfully:', savedPost);
    } catch (error) {
      console.error('Error scheduling post:', error);
      addToast('Failed to schedule post', 'info');
    }
  };

  const handleLogout = async () => {
    if (auth?.token) {
      await fetch('/api/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
    }
    localStorage.removeItem('brandpilot_auth');
    setAuth(null);
    addToast('Logged out successfully', 'success');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onNavigate={navigateWithTopic} hasDNA={!!dna} auth={auth} />;
      case 'dna': return (
        <BrandDNA 
          dna={dna} 
          setDna={setDna} 
          userPlan={userPlan}
          onUpgrade={handleOpenPlanModal}
          onCreditsUpdate={handleCreditsUpdate}
          userId={auth?.userId}
        />
      );
      case 'strategist': return (
        <ContentStrategist 
          dna={dna} 
          onNavigate={navigateWithTopic}
          userPlan={userPlan}
          onUpgrade={handleOpenPlanModal}
          onCreditsUpdate={handleCreditsUpdate}
          userId={auth?.userId}
        />
      );
      case 'engine': return (
        <ContentEngine 
          dna={dna} 
          initialTopic={draftTopic} 
          onAction={addToast} 
          onSchedulePost={handleSchedulePost}
          autoPostEnabled={autoPost}
          onToggleAutoPost={async (val) => {
            setAutoPost(val);
            // Save to database
            try {
              await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'auto_post_enabled', value: String(val) })
              });
              console.log('Auto-post setting saved:', val);
              addToast(val ? 'Auto-post enabled - monitoring scheduled posts' : 'Auto-post disabled', 'success');
            } catch (error) {
              console.error('Error saving auto-post setting:', error);
            }
          }}
          userPlan={userPlan}
          onUpgrade={handleOpenPlanModal}
          onCreditsUpdate={handleCreditsUpdate}
          userId={auth?.userId}
        />
      );
      case 'calendar': return (
        <CalendarView 
          scheduledPosts={scheduledPosts} 
          onAction={addToast} 
          autoPostMode={autoPost}
          userId={auth?.userId || ''}
        />
      );
      case 'connections': return <Connections onAction={addToast} onNavigate={(tab) => setActiveTab(tab)} />;
      case 'credentials': return <Credentials onAction={addToast} />;
      case 'performance': return <PerformanceBrain onNavigate={navigateWithTopic} userId={auth?.userId || ''} />;
      case 'monetization': return (
        <Monetization 
          dna={dna} 
          onAction={addToast}
          userPlan={userPlan}
          onUpgrade={handleOpenPlanModal}
          onCreditsUpdate={handleCreditsUpdate}
          userId={auth?.userId}
        />
      );
      case 'payment-history': return <PaymentHistory onAction={addToast} />;
      case 'credits': return <Credits onAction={addToast} />;
      case 'profile': return <Profile auth={auth} userPlan={userPlan} onAction={addToast} onUpdate={(newAuth) => setAuth(newAuth)} />;
      case 'email-logs': return <EmailLogs />;
      case 'platform-responses': return <PlatformResponses onAction={addToast} auth={auth} />;
      case 'documentation': return <Documentation />;
      case 'adminposts': return <AdminPosts />;
      case 'api-test': return <APIConnectionTest />;
      default: return <Dashboard onNavigate={navigateWithTopic} hasDNA={!!dna} auth={auth} />;
    }
  };
// Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading session...</p>
        </div>
      </div>
    );
  }

  
  if (!auth) {
    return <AdminLogin onLogin={(authData) => {
      console.log('🔐 Login successful, setting auth with userId:', authData.userId);
      setAuth(authData);
      setUserPlan({
        plan: authData.plan,
        credits: authData.credits,
        maxCredits: authData.maxCredits
      });
    }} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onAction={addToast} 
        handleLogout={handleLogout}
        userPlan={userPlan}
        onPlanUpgrade={handlePlanUpgrade}
      />
      
      <main className="flex-1 ml-64 min-h-screen pb-12">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4 bg-slate-100 px-4 py-2 rounded-xl w-96 group focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
            <Search size={18} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Search posts, analytics, or strategy..." 
              className="bg-transparent border-none outline-none text-sm w-full text-slate-600"
              onKeyDown={(e) => e.key === 'Enter' && addToast('Search results coming soon...')}
            />
          </div>
          
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-bold text-sm transition-all ${
              autoPost ? 'bg-indigo-600 text-white border-indigo-500 animate-pulse' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
            }`}>
              {autoPost ? <Zap size={16} fill="currentColor" /> : <Sparkles size={16} />}
              AI Agent: {autoPost ? 'Active & Posting' : 'Idle'}
            </div>
            
            <button 
              onClick={() => addToast('No new notifications')}
              className="text-slate-400 hover:text-slate-600 transition-colors relative"
            >
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-6 border-slate-200">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">{auth?.username || 'User'}</p>
                <p className="text-xs text-slate-500 font-medium capitalize">{userPlan.plan} Plan</p>
              </div>
              <img 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(auth?.username || 'User')}&background=${auth?.avatarStyle || '6366f1'}&color=fff&size=100&bold=true`}
                alt="Profile" 
                className="w-10 h-10 rounded-xl border-2 border-slate-200 object-cover cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all"
                onClick={() => setActiveTab('profile')}
                title="View Profile Settings"
              />
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>

      {/* Toasts container */}
      <div className="fixed top-24 right-8 z-[100] flex flex-col gap-3">
        {toasts.map(toast => (
          <div key={toast.id} className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right duration-300 ${
            toast.type === 'success' ? 'bg-emerald-900 border-emerald-800 text-white' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            {toast.type === 'success' ? <CheckCircle className="text-emerald-400" size={20} /> : <Sparkles className="text-indigo-400" size={20} />}
            <p className="font-medium text-sm">{toast.message}</p>
            <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="ml-2 text-slate-400 hover:text-white">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Persistent AI Agent Floating Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-2xl hover:scale-105 transition-transform group relative">
          <Sparkles className={autoPost ? "animate-spin text-indigo-400" : "animate-pulse"} size={28} />
          <div className="absolute bottom-full right-0 mb-4 w-64 bg-white p-4 rounded-2xl border border-slate-200 shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all text-left pointer-events-none group-hover:pointer-events-auto">
            <p className="text-xs font-bold text-indigo-600 uppercase mb-1">Agent Suggestion</p>
            <p className="text-sm text-slate-700 font-medium leading-tight">
              {autoPost 
                ? "I'm currently monitoring your schedule. Relax, I'll take care of the posting."
                : "Your audience is active right now. Should I draft a quick thread about your latest Brand DNA discovery?"}
            </p>
            {!autoPost && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigateWithTopic('engine', 'Insights from my latest Brand DNA discovery and how it changed my content strategy...');
                  addToast('Draft prepped by AI Agent!');
                }}
                className="mt-3 w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
              >
                Yes, let's go!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
