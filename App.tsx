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
import AdminLogin from './components/AdminLogin';
import AdminPosts from './components/AdminPosts';
import { ActiveTab, BrandDNA as BrandDNAType, ContentItem, SAMPLE_SCHEDULED_POSTS } from './types';
import { Sparkles, Bell, Search, X, CheckCircle, Zap } from 'lucide-react';
import { publishToPlatform } from './services/gemini.client';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [dna, setDna] = useState<BrandDNAType | null>(null);
  const [draftTopic, setDraftTopic] = useState<string>('');
  const [scheduledPosts, setScheduledPosts] = useState<ContentItem[]>(SAMPLE_SCHEDULED_POSTS);
  const [toasts, setToasts] = useState<{id: number, message: string, type: 'success' | 'info'}[]>([]);
  const [autoPost, setAutoPost] = useState<boolean>(false);
  const [auth, setAuth] = useState<{ token: string; role: string } | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const addToast = (message: string, type: 'success' | 'info' = 'info') => {
    if (!message) return;
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

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
            setAuth(authData);
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

        if (!response.ok) {
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

  // Simulated Agentic Background Worker
  useEffect(() => {
    if (!autoPost) return;

    const interval = setInterval(async () => {
      const now = new Date();
      const duePosts = scheduledPosts.filter(post => 
        post.status === 'Scheduled' && new Date(post.scheduledFor) <= now
      );

      if (duePosts.length > 0) {
        for (const post of duePosts) {
          try {
            console.log(`[Agent] Auto-publishing due post: ${post.id}`);
            
            // Use the provided imageUrl directly - don't generate fallback
            const imageUrl = post.imageUrl;
            
            if ((post.platform === 'Instagram' || post.platform === 'Facebook') && !imageUrl) {
              console.warn(`[Agent] No image URL provided for ${post.platform} post. Instagram/Facebook require images.`);
              addToast(`Instagram/Facebook post requires an image. Skipping post: ${post.id}`);
              // Mark as failed but continue
              setScheduledPosts(prev => prev.map(p => 
                p.id === post.id ? { ...p, status: 'Failed' as const } : p
              ));
              continue;
            }
            
            console.log(`[Agent] Using image URL:`, imageUrl ? imageUrl.substring(0, 50) + '...' : 'none');
            
            await publishToPlatform(post.platform, post.content, { 
              imageUrl: imageUrl || undefined
            });
            
            setScheduledPosts(prev => prev.map(p => 
              p.id === post.id ? { ...p, status: 'Published' as const } : p
            ));
            
            addToast(`Agent successfully published scheduled post to ${post.platform}!`, 'success');
          } catch (error: any) {
            const errorMsg = error?.message || "Background Task Error";
            console.error("Auto-post worker error:", error);
            addToast(`Auto-post failed: ${errorMsg}`);
          }
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [autoPost, scheduledPosts]);

  const navigateWithTopic = (tab: ActiveTab, topic: string) => {
    setDraftTopic(topic);
    setActiveTab(tab);
  };

  const handleSchedulePost = (post: ContentItem) => {
    setScheduledPosts(prev => [...prev, post]);
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
      case 'dashboard': return <Dashboard onNavigate={navigateWithTopic} hasDNA={!!dna} />;
      case 'dna': return <BrandDNA dna={dna} setDna={setDna} />;
      case 'strategist': return <ContentStrategist dna={dna} onNavigate={navigateWithTopic} />;
      case 'engine': return (
        <ContentEngine 
          dna={dna} 
          initialTopic={draftTopic} 
          onAction={addToast} 
          onSchedulePost={handleSchedulePost}
          autoPostEnabled={autoPost}
          onToggleAutoPost={setAutoPost}
        />
      );
      case 'calendar': return (
        <CalendarView 
          scheduledPosts={scheduledPosts} 
          onAction={addToast} 
          autoPostMode={autoPost}
        />
      );
      case 'connections': return <Connections onAction={addToast} />;
      case 'credentials': return <Credentials onAction={addToast} />;
      case 'performance': return <PerformanceBrain onNavigate={navigateWithTopic} />;
      case 'monetization': return <Monetization dna={dna} onAction={addToast} />;
      case 'documentation': return <Documentation />;
      case 'adminposts': return <AdminPosts />;
      default: return <Dashboard onNavigate={navigateWithTopic} hasDNA={!!dna} />;
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
    return <AdminLogin onLogin={(token, role) => setAuth({ token, role })} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onAction={addToast} handleLogout={handleLogout} />
      
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
            
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">Alex Rivera</p>
                <p className="text-xs text-slate-500 font-medium">Founder & Creator</p>
              </div>
              <img 
                src="https://picsum.photos/seed/alex/100/100" 
                alt="Profile" 
                className="w-10 h-10 rounded-xl border border-slate-200 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => addToast('Profile settings coming soon...')}
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
