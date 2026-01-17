
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  ChevronRight,
  Zap,
  Star,
  Sparkles,
  GraduationCap,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ActiveTab } from '../types';

interface DashboardProps {
  onNavigate: (tab: ActiveTab, topic: string) => void;
  hasDNA: boolean;
  auth?: { userId: string; username: string };
}

interface DashboardStats {
  totalPosts: number;
  publishedPosts: number;
  failedPosts: number;
  scheduledPosts: number;
  totalPlatforms: number;
  successRate: number;
  recentPosts: any[];
  platformBreakdown: { platform: string; count: number; color: string }[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, hasDNA, auth }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    publishedPosts: 0,
    failedPosts: 0,
    scheduledPosts: 0,
    totalPlatforms: 0,
    successRate: 0,
    recentPosts: [],
    platformBreakdown: []
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/posts/all');
      if (!response.ok) throw new Error('Failed to fetch posts');
      
      const posts = await response.json();
      
      // Normalize platform names for consistent grouping
      const normalizePlatform = (platform: string) => {
        const lower = platform.toLowerCase();
        if (lower.includes('twitter') || lower.includes('x (') || lower === 'x') return 'Twitter/X';
        if (lower.includes('facebook')) return 'Facebook';
        if (lower.includes('instagram')) return 'Instagram';
        if (lower.includes('linkedin')) return 'LinkedIn';
        if (lower.includes('youtube')) return 'YouTube';
        return platform; // Return original if no match
      };
      
      // Normalize platforms in posts
      const normalizedPosts = posts.map((post: any) => ({
        ...post,
        normalizedPlatform: normalizePlatform(post.platform)
      }));
      
      // Calculate statistics
      const totalPosts = normalizedPosts.length;
      const publishedPosts = normalizedPosts.filter((p: any) => p.status === 'published').length;
      const failedPosts = normalizedPosts.filter((p: any) => p.status === 'failed').length;
      const scheduledPosts = normalizedPosts.filter((p: any) => p.status === 'scheduled').length;
      const platforms = [...new Set(normalizedPosts.map((p: any) => p.normalizedPlatform))];
      const successRate = totalPosts > 0 ? Math.round((publishedPosts / (publishedPosts + failedPosts)) * 100) : 0;
      
      // Platform breakdown with normalized names
      const platformCounts = platforms.map(platform => ({
        platform,
        count: normalizedPosts.filter((p: any) => p.normalizedPlatform === platform).length,
        color: COLORS[platforms.indexOf(platform) % COLORS.length]
      })).sort((a, b) => b.count - a.count); // Sort by count descending
      
      // Recent posts (last 5)
      const recentPosts = normalizedPosts
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      setStats({
        totalPosts,
        publishedPosts,
        failedPosts,
        scheduledPosts,
        totalPlatforms: platforms.length,
        successRate: isNaN(successRate) ? 0 : successRate,
        recentPosts,
        platformBreakdown: platformCounts
      });
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle2 className="text-green-500" size={16} />;
      case 'failed':
        return <XCircle className="text-red-500" size={16} />;
      case 'scheduled':
        return <Clock className="text-yellow-500" size={16} />;
      default:
        return <Activity className="text-gray-500" size={16} />;
    }
  };

  const generateChartData = () => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayPosts = stats.recentPosts.filter((post: any) => {
        const postDate = new Date(post.createdAt);
        return postDate.toDateString() === date.toDateString();
      });
      
      last7Days.push({
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        posts: dayPosts.length,
        published: dayPosts.filter((p: any) => p.status === 'published').length
      });
    }
    return last7Days;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="animate-spin text-indigo-600" size={32} />
          <span className="ml-3 text-lg text-slate-600">Loading dashboard...</span>
        </div>
      </div>
    );
  }
  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, {auth?.username || 'Creator'}!</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-500">Last updated: {lastUpdated.toLocaleTimeString()}</p>
            <button 
              onClick={fetchDashboardData}
              className="p-1 hover:bg-slate-100 rounded-md transition-colors"
              title="Refresh data"
            >
              <RefreshCw size={14} className="text-slate-400" />
            </button>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => onNavigate('calendar', '')}
            className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl font-medium hover:bg-slate-200 transition-all"
          >
            <Calendar size={18} />
            Schedule
          </button>
          <button 
            onClick={() => onNavigate('engine', '')}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all"
          >
            <Zap size={18} />
            Quick Post
          </button>
        </div>
      </header>

      {!hasDNA ? (
        <div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute -left-10 -bottom-10 opacity-10">
            <Sparkles size={200} />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">Unleash Your Brand DNA</h2>
            <p className="text-indigo-100 max-w-lg">
              Analyze your brand voice and get AI-powered content strategies tailored to your unique style.
            </p>
          </div>
          <button 
            onClick={() => onNavigate('dna', '')}
            className="bg-white text-indigo-600 px-8 py-3 rounded-2xl font-bold hover:bg-indigo-50 transition-all shadow-lg relative z-10 whitespace-nowrap active:scale-95 flex items-center gap-2"
          >
            <GraduationCap size={20} /> Analyze Brand DNA
          </button>
        </div>
      ) : (
        <div className="bg-white border border-indigo-100 rounded-3xl p-6 flex items-center justify-between shadow-sm">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
               <GraduationCap size={24} />
             </div>
             <div>
               <h2 className="font-bold text-slate-900">Brand DNA Active</h2>
               <p className="text-sm text-slate-500">AI is optimized for your unique brand voice and style.</p>
             </div>
           </div>
           <button 
             onClick={() => onNavigate('strategist', '')}
             className="text-indigo-600 font-bold text-sm hover:underline"
           >
             View Content Strategy
           </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: 'Total Posts', 
            value: stats.totalPosts.toString(), 
            growth: stats.totalPosts > 0 ? `${stats.totalPlatforms} platforms` : 'No posts yet', 
            icon: TrendingUp, 
            color: 'text-emerald-500', 
            bg: 'bg-emerald-50',
            onClick: () => onNavigate('platform-responses', '')
          },
          { 
            label: 'Published', 
            value: stats.publishedPosts.toString(), 
            growth: stats.successRate > 0 ? `${stats.successRate}% success` : 'N/A', 
            icon: CheckCircle2, 
            color: 'text-indigo-500', 
            bg: 'bg-indigo-50',
            onClick: () => onNavigate('platform-responses', '')
          },
          { 
            label: 'Scheduled', 
            value: stats.scheduledPosts.toString(), 
            growth: stats.scheduledPosts > 0 ? 'Pending' : 'None', 
            icon: Clock, 
            color: 'text-amber-500', 
            bg: 'bg-amber-50',
            onClick: () => onNavigate('calendar', '')
          },
          { 
            label: 'Failed Posts', 
            value: stats.failedPosts.toString(), 
            growth: stats.failedPosts > 0 ? 'Need review' : 'All good', 
            icon: XCircle, 
            color: stats.failedPosts > 0 ? 'text-red-500' : 'text-green-500', 
            bg: stats.failedPosts > 0 ? 'bg-red-50' : 'bg-green-50',
            onClick: () => onNavigate('platform-responses', '')
          },
        ].map((stat, i) => (
          <div 
            key={i} 
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer transform hover:scale-105"
            onClick={stat.onClick}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl transition-transform group-hover:scale-110 ${stat.bg} ${stat.color}`}>
                <stat.icon size={22} />
              </div>
              <span className={`text-sm font-bold ${stat.color}`}>{stat.growth}</span>
            </div>
            <h3 className="text-slate-500 font-medium text-sm">{stat.label}</h3>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-slate-900">Post Activity (Last 7 Days)</h2>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Activity size={16} />
              Live Data
            </div>
          </div>
          <div className="h-[300px] w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={generateChartData()}>
                <defs>
                  <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                />
                <Area type="monotone" dataKey="posts" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorPosts)" />
                <Area type="monotone" dataKey="published" stroke="#10b981" strokeWidth={2} fillOpacity={0.3} fill="#10b981" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Breakdown & Recent Activity */}
        <div className="space-y-6">
          {/* Platform Distribution */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Platform Distribution</h3>
            {stats.platformBreakdown.length > 0 ? (
              <div className="space-y-3">
                {stats.platformBreakdown.map((platform, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: platform.color }}
                      ></div>
                      <span className="text-sm text-slate-600">{platform.platform}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{platform.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">No posts yet</p>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Activity size={120} />
            </div>
            <h3 className="text-lg font-bold mb-4 relative z-10">Recent Activity</h3>
            <div className="space-y-3 relative z-10">
              {stats.recentPosts.length > 0 ? (
                stats.recentPosts.slice(0, 3).map((post: any, index: number) => (
                  <div key={index} className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-indigo-400 font-semibold">{post.platform}</span>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(post.status)}
                        <span className="text-xs text-slate-300">{post.status}</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {post.content.length > 60 ? `${post.content.substring(0, 60)}...` : post.content}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="mx-auto mb-2 opacity-30" size={32} />
                  <p className="text-slate-400">No recent posts</p>
                </div>
              )}
            </div>
            
            {stats.recentPosts.length > 0 && (
              <button 
                onClick={() => onNavigate('platform-responses', '')}
                className="w-full mt-4 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-500 transition-colors shadow-lg active:scale-95"
              >
                View All Responses <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {stats.scheduledPosts > 0 && (
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-3xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold">Posts Scheduled</h3>
                <p className="text-amber-100">You have {stats.scheduledPosts} posts waiting to be published</p>
              </div>
            </div>
            <button 
              onClick={() => onNavigate('calendar', '')}
              className="bg-white text-amber-600 px-6 py-2 rounded-xl font-semibold hover:bg-amber-50 transition-colors"
            >
              View Calendar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
