
import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, Lightbulb, CheckCircle, Users, Eye, Heart, Share2 } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { ActiveTab } from '../types';

interface PerformanceBrainProps {
  onNavigate: (tab: ActiveTab, topic: string) => void;
  userId: string;
}

interface AnalyticsData {
  categoryStats: Array<{ name: string; engagement: number; color: string; posts: number }>;
  totalStats: { views: number; likes: number; shares: number; comments: number; posts: number };
  platformStats: Array<{ platform: string; engagement: number; posts: number }>;
  topPost: { content: string; engagement: number; platform: string } | null;
  insights: { worked: string; failed: string; recommendation: string };
}

const PerformanceBrain: React.FC<PerformanceBrainProps> = ({ onNavigate, userId }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    categoryStats: [],
    totalStats: { views: 0, likes: 0, shares: 0, comments: 0, posts: 0 },
    platformStats: [],
    topPost: null,
    insights: {
      worked: 'Loading insights...',
      failed: 'Analyzing performance patterns...',
      recommendation: 'Generating recommendations...'
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!userId) {
        console.log('PerformanceBrain: No userId provided');
        setLoading(false);
        return;
      }
      
      try {
        console.log('Fetching analytics for userId:', userId);
        const authData = JSON.parse(localStorage.getItem('brandpilot_auth') || '{}');
        const headers: HeadersInit = {};
        if (authData.token) {
          headers['Authorization'] = `Bearer ${authData.token}`;
        }
        const response = await fetch(`http://localhost:3001/api/analytics/${userId}`, { headers });
        if (response.ok) {
          const data = await response.json();
          console.log('Analytics data received:', data);
          setAnalytics(data);
        } else {
          console.error('Failed to fetch analytics:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [userId]);

  const data = analytics.categoryStats.length > 0 ? analytics.categoryStats : [
    { name: 'No Data Yet', engagement: 0, color: '#94a3b8', posts: 0 },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
          <BarChart3 size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Performance Brain</h1>
          <p className="text-slate-500">Deep-dive analysis on why your content works (or doesn't).</p>
        </div>
      </div>

      {/* Real-time Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Eye className="text-indigo-600" size={24} />
            <span className="text-xs font-bold text-slate-500 uppercase">Total Views</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{analytics.totalStats.views.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">{analytics.totalStats.posts} published posts</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Heart className="text-rose-600" size={24} />
            <span className="text-xs font-bold text-slate-500 uppercase">Total Likes</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{analytics.totalStats.likes.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">
            {analytics.totalStats.posts > 0 ? Math.round(analytics.totalStats.likes / analytics.totalStats.posts) : 0} avg per post
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Share2 className="text-emerald-600" size={24} />
            <span className="text-xs font-bold text-slate-500 uppercase">Total Shares</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{analytics.totalStats.shares.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">
            {analytics.totalStats.posts > 0 ? Math.round(analytics.totalStats.shares / analytics.totalStats.posts) : 0} avg per post
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Users className="text-amber-600" size={24} />
            <span className="text-xs font-bold text-slate-500 uppercase">Engagement</span>
          </div>
          <p className="text-3xl font-black text-slate-900">
            {analytics.totalStats.posts > 0 
              ? Math.round(((analytics.totalStats.likes + analytics.totalStats.shares + analytics.totalStats.comments) / analytics.totalStats.views) * 100) || 0
              : 0}%
          </p>
          <p className="text-xs text-slate-500 mt-1">{analytics.totalStats.comments} comments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold mb-6">Engagement by Content Category</h2>
          {loading ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-slate-400">Loading analytics...</div>
            </div>
          ) : analytics.categoryStats.length === 0 ? (
            <div className="h-[400px] flex flex-col items-center justify-center text-center">
              <BarChart3 className="text-slate-300 mb-4" size={64} />
              <p className="text-slate-600 font-semibold mb-2">No Published Content Yet</p>
              <p className="text-slate-400 text-sm">Publish some posts to see your performance analytics</p>
            </div>
          ) : (
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontWeight: 500}} width={120} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                />
                <Bar dataKey="engagement" radius={[0, 8, 8, 0]} barSize={32}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl">
            <div className="flex items-center gap-3 text-emerald-700 font-bold mb-3">
              <CheckCircle size={20} />
              <span>What Worked</span>
            </div>
            <p className="text-emerald-900 text-sm leading-relaxed font-medium">
              {analytics.insights.worked}
            </p>
          </div>

          <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl">
            <div className="flex items-center gap-3 text-rose-700 font-bold mb-3">
              <AlertTriangle size={20} />
              <span>What Failed</span>
            </div>
            <p className="text-rose-900 text-sm leading-relaxed font-medium">
              {analytics.insights.failed}
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl">
            <div className="flex items-center gap-3 text-amber-700 font-bold mb-3">
              <Lightbulb size={20} />
              <span>The Repeatable Flywheel</span>
            </div>
            <p className="text-amber-900 text-sm leading-relaxed font-medium italic">
              {analytics.insights.recommendation}
            </p>
          </div>
          
          {analytics.topPost && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 p-6 rounded-3xl">
              <div className="flex items-center gap-3 text-indigo-700 font-bold mb-3">
                <TrendingUp size={20} />
                <span>Top Performing Post</span>
              </div>
              <p className="text-indigo-900 text-xs leading-relaxed mb-3 line-clamp-3">
                {analytics.topPost.content}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-600">{analytics.topPost.platform}</span>
                <span className="text-xs font-bold text-indigo-900">{analytics.topPost.engagement}% engagement</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <TrendingUp className="text-indigo-400" />
              Growth Intelligence Prediction
            </h2>
            <p className="text-slate-400 max-w-xl">
              {analytics.totalStats.posts > 0 
                ? `Based on ${analytics.totalStats.posts} published posts with ${Math.round(((analytics.totalStats.likes + analytics.totalStats.shares) / analytics.totalStats.posts) * 100) / 100}x avg engagement, continue your current content mix for sustained growth.`
                : "Publish your first posts to get AI-powered growth predictions and recommendations."}
            </p>
          </div>
          <button 
            onClick={() => onNavigate('engine', 'Create a high-engagement post based on my best-performing content patterns')}
            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 whitespace-nowrap active:scale-95"
          >
            {analytics.totalStats.posts > 0 ? 'Generate Similar Content' : 'Create First Post'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PerformanceBrain;
