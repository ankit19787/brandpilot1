
import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, MoreVertical, ExternalLink, CheckCircle, Zap, Sparkles } from 'lucide-react';
import { ContentItem } from '../types';
import { canUseFeature } from '../services/planService';
import FeatureGate from './FeatureGate';

interface CalendarViewProps {
  scheduledPosts: ContentItem[];
  onAction: (msg: string) => void;
  autoPostMode: boolean;
  userId: string;
  userPlan?: { plan: string; credits: number; maxCredits: number };
  onUpgrade: () => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ scheduledPosts, onAction, autoPostMode, userId, userPlan = { plan: 'free', credits: 0, maxCredits: 1000 }, onUpgrade }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const canUseScheduling = canUseFeature(userPlan.plan, 'scheduling');
  
  // Get user role from localStorage
  useEffect(() => {
    try {
      const authData = JSON.parse(localStorage.getItem('brandpilot_auth') || '{}');
      setUserRole(authData.user?.role || 'user');
    } catch (error) {
      console.error('Error reading auth data:', error);
      setUserRole('user');
    }
  }, []);
  
  const sortedPosts = [...scheduledPosts].sort((a, b) => 
    new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
  );

  // Calculate weekly stats
  const getWeeklyStats = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    
    const weeklyPosts = scheduledPosts.filter(post => {
      const postDate = new Date(post.scheduledFor);
      return postDate >= startOfWeek && postDate < endOfWeek;
    });
    
    return {
      count: weeklyPosts.length,
      target: 7,
      posts: weeklyPosts
    };
  };

  // Find gaps in schedule and generate smart recommendation
  const getScheduleRecommendation = () => {
    if (autoPostMode) {
      return "Agent is scanning your queue. All posts will be published automatically as scheduled.";
    }

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeklyPosts = getWeeklyStats().posts;
    
    // Check which days have posts
    const daysWithPosts = new Set(
      weeklyPosts.map(post => new Date(post.scheduledFor).getDay())
    );
    
    // Find gaps
    const gaps = weekDays.filter((_, index) => !daysWithPosts.has(index));
    
    if (gaps.length === 0) {
      return "Great job! Your week is fully scheduled. Consider preparing content for next week.";
    }
    
    if (weeklyPosts.length === 0) {
      return "Your calendar is empty. Start by scheduling 2-3 posts for the week to maintain consistency.";
    }
    
    // Find recent performing posts
    const recentPosts = weeklyPosts.filter(p => new Date(p.scheduledFor) < now);
    if (recentPosts.length > 0 && gaps.length > 0) {
      const lastPost = recentPosts[recentPosts.length - 1];
      const lastPostDay = weekDays[new Date(lastPost.scheduledFor).getDay()];
      const firstGap = gaps[0];
      return `You have a gap on ${firstGap}. ${lastPostDay}'s post is scheduled, consider a follow-up for ${firstGap}.`;
    }
    
    return `You have ${gaps.length} day${gaps.length > 1 ? 's' : ''} without posts this week: ${gaps.join(', ')}. Fill these gaps to maintain engagement.`;
  };

  const weeklyStats = getWeeklyStats();

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const currentMonthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  // Filter posts by platform
  const filteredPosts = selectedPlatform === 'all' 
    ? sortedPosts 
    : sortedPosts.filter(post => post.platform === selectedPlatform);
  
  // Filter posts for current month
  const currentMonthPosts = filteredPosts.filter(post => {
    const postDate = new Date(post.scheduledFor);
    return postDate.getMonth() === currentDate.getMonth() && 
           postDate.getFullYear() === currentDate.getFullYear();
  });

  // Filter posts for selected date
  const selectedDatePosts = selectedDate ? filteredPosts.filter(post => {
    const postDate = new Date(post.scheduledFor);
    return postDate.getDate() === selectedDate.getDate() &&
           postDate.getMonth() === selectedDate.getMonth() &&
           postDate.getFullYear() === selectedDate.getFullYear();
  }) : currentMonthPosts;

  // Generate calendar grid
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const calendarDays = getDaysInMonth(currentDate);
  
  const getPostsForDate = (date: Date) => {
    return filteredPosts.filter(post => {
      const postDate = new Date(post.scheduledFor);
      return postDate.getDate() === date.getDate() &&
             postDate.getMonth() === date.getMonth() &&
             postDate.getFullYear() === date.getFullYear();
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  return (
    <FeatureGate
      isLocked={!canUseScheduling}
      requiredPlan="pro"
      featureName="Content Calendar"
      onUpgrade={onUpgrade}
    >
      <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
            <CalendarIcon size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Content Calendar</h1>
            <p className="text-slate-500">Manage and preview your upcoming brand presence.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm">
          <button 
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-bold text-slate-700 px-4 min-w-[140px] text-center">{currentMonthYear}</span>
          <button 
            onClick={goToNextMonth}
            className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Platform Filter */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <span className="text-sm font-bold text-slate-600 uppercase tracking-wide">Filter by Platform:</span>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedPlatform('all')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              selectedPlatform === 'all'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Platforms
          </button>
          <button
            onClick={() => setSelectedPlatform('Instagram')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              selectedPlatform === 'Instagram'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Instagram
          </button>
          <button
            onClick={() => setSelectedPlatform('Facebook')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              selectedPlatform === 'Facebook'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Facebook
          </button>
          {userRole === 'admin' && (
            <button
              onClick={() => setSelectedPlatform('X')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                selectedPlatform === 'X'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              X (Twitter)
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Calendar Grid */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }
                
                const postsOnDay = getPostsForDate(day);
                const hasPost = postsOnDay.length > 0;
                const todayClass = isToday(day);
                const selectedClass = isSelected(day);
                
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(day)}
                    className={`aspect-square rounded-xl p-2 text-sm font-semibold transition-all relative group
                      ${selectedClass ? 'bg-indigo-600 text-white shadow-lg scale-105' : 
                        todayClass ? 'bg-indigo-100 text-indigo-900 border-2 border-indigo-400' :
                        hasPost ? 'bg-slate-50 text-slate-900 hover:bg-indigo-50' : 
                        'text-slate-400 hover:bg-slate-50'}
                    `}
                  >
                    <span className="block">{day.getDate()}</span>
                    {hasPost && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                        {postsOnDay.slice(0, 3).map((_, i) => (
                          <div key={i} className={`w-1 h-1 rounded-full ${selectedClass ? 'bg-white' : 'bg-indigo-600'}`} />
                        ))}
                      </div>
                    )}
                    {hasPost && (
                      <div className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {postsOnDay.length}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedDate && (
              <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={16} className="text-indigo-600" />
                    <span className="font-bold text-indigo-900">
                      {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <button 
                    onClick={() => setSelectedDate(null)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    View All
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Posts List */}
          {selectedDatePosts.length === 0 ? (
            <div className="bg-white rounded-[2rem] border border-slate-200 border-dashed p-20 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                <CalendarIcon size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {selectedDate 
                  ? `No posts scheduled for ${selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
                  : `No posts scheduled for ${currentMonthYear}`}
              </h3>
              <p className="text-slate-500 max-w-xs mb-8">
                {sortedPosts.length === 0 
                  ? "Head over to the Content Engine to draft and schedule your first post."
                  : selectedDate 
                    ? "Click on a highlighted date to see scheduled posts, or create new content."
                    : "No posts scheduled for this month. Navigate to another month or schedule new content."}
              </p>
              <button 
                onClick={() => onAction('Opening Content Engine...')}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
              >
                Go to Content Engine
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDatePosts.map((post) => {
                const date = new Date(post.scheduledFor);
                const isPublished = post.status === 'Published';
                return (
                  <div key={post.id} className={`bg-white p-6 rounded-3xl border transition-all flex gap-6 hover:shadow-md group ${isPublished ? 'border-emerald-100 opacity-75' : 'border-slate-200 shadow-sm'}`}>
                    <div className={`flex flex-col items-center justify-center min-w-[80px] h-[80px] rounded-2xl border ${isPublished ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                      <span className={`text-xs font-bold uppercase tracking-widest ${isPublished ? 'text-emerald-600' : 'text-indigo-600'}`}>
                        {date.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className={`text-2xl font-black ${isPublished ? 'text-emerald-900' : 'text-slate-900'}`}>
                        {date.getDate()}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
                          }`}>
                            {post.platform}
                          </span>
                          
                          {isPublished ? (
                            <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                              <CheckCircle size={12} />
                              Published
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-slate-400 text-xs font-bold">
                              <Clock size={12} />
                              {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}

                          {!isPublished && autoPostMode && (
                            <div className="flex items-center gap-1 text-indigo-500 text-xs font-black animate-pulse">
                              <Zap size={12} fill="currentColor" />
                              AI Managed
                            </div>
                          )}
                        </div>
                        <button className="text-slate-300 hover:text-slate-600 transition-colors">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                      <p className={`line-clamp-2 leading-relaxed ${isPublished ? 'text-slate-500 italic' : 'text-slate-700 font-medium'}`}>
                        {post.content}
                      </p>
                    </div>

                    <div className="flex flex-col justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onAction(isPublished ? 'Opening live analytics...' : 'Opening post preview...')}
                        className={`p-2 rounded-lg transition-colors border ${isPublished ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' : 'bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border-slate-100'}`}
                        title={isPublished ? "View Live" : "Edit Draft"}
                      >
                        <ExternalLink size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className={`p-8 rounded-[2rem] shadow-xl relative overflow-hidden transition-colors ${autoPostMode ? 'bg-indigo-600 text-white' : 'bg-indigo-900 text-white'}`}>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Sparkles className={autoPostMode ? 'animate-spin' : ''} size={20} />
              Scheduler Health
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-indigo-200">Weekly Target</span>
                  <span className="font-bold">{weeklyStats.count} / {weeklyStats.target} Posts</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-white transition-all duration-1000" style={{ width: `${(weeklyStats.count / weeklyStats.target) * 100}%` }} />
                </div>
              </div>

              <div className={`p-4 backdrop-blur-md rounded-2xl border ${autoPostMode ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/10'}`}>
                <p className="text-xs text-indigo-200 font-bold uppercase tracking-widest mb-2">
                  {autoPostMode ? 'Agent Status' : 'AI Recommendation'}
                </p>
                <p className="text-sm leading-relaxed">
                  {getScheduleRecommendation()}
                </p>
              </div>

              {!autoPostMode && weeklyStats.count < weeklyStats.target && (
                <button 
                  onClick={() => onAction('Auto-fill feature coming soon! This will analyze your best-performing content and suggest optimal times to post.')}
                  className="w-full py-3 bg-white text-indigo-900 rounded-xl font-bold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                >
                  Auto-fill Gaps <Sparkles size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Platform Breakdown</h3>
            <div className="space-y-4">
              {[
                { label: 'Instagram', count: sortedPosts.filter(p => p.platform === 'Instagram').length, color: 'bg-pink-600' },
                ...(userRole === 'admin' ? [
                  { label: 'X (Twitter)', count: sortedPosts.filter(p => p.platform === 'X (Twitter)' || p.platform === 'Twitter').length, color: 'bg-slate-900' }
                ] : []),
                { label: 'Facebook', count: sortedPosts.filter(p => p.platform === 'Facebook').length, color: 'bg-blue-700' }
              ].map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${p.color}`} />
                  <span className="text-sm text-slate-600 flex-1">{p.label}</span>
                  <span className="text-sm font-bold text-slate-900">{p.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
    </FeatureGate>
  );
};

export default CalendarView;
