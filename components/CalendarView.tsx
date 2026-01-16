
import React from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, MoreVertical, ExternalLink, Sparkles, Zap, CheckCircle } from 'lucide-react';
import { ContentItem } from '../types';

interface CalendarViewProps {
  scheduledPosts: ContentItem[];
  onAction: (msg: string) => void;
  autoPostMode: boolean;
}

const CalendarView: React.FC<CalendarViewProps> = ({ scheduledPosts, onAction, autoPostMode }) => {
  const sortedPosts = [...scheduledPosts].sort((a, b) => 
    new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
  );

  return (
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
          <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400"><ChevronLeft size={20} /></button>
          <span className="font-bold text-slate-700 px-4">May 2024</span>
          <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {sortedPosts.length === 0 ? (
            <div className="bg-white rounded-[2rem] border border-slate-200 border-dashed p-20 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                <CalendarIcon size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No posts scheduled yet</h3>
              <p className="text-slate-500 max-w-xs mb-8">Head over to the Content Engine to draft and schedule your first post.</p>
              <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
                Go to Content Engine
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedPosts.map((post) => {
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
                  <span className="font-bold">{sortedPosts.length} / 7 Posts</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-white transition-all duration-1000" style={{ width: `${(sortedPosts.length / 7) * 100}%` }} />
                </div>
              </div>

              <div className={`p-4 backdrop-blur-md rounded-2xl border ${autoPostMode ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/10'}`}>
                <p className="text-xs text-indigo-200 font-bold uppercase tracking-widest mb-2">
                  {autoPostMode ? 'Agent Status' : 'AI Recommendation'}
                </p>
                <p className="text-sm leading-relaxed">
                  {autoPostMode 
                    ? "Agent is scanning your queue. All posts will be published automatically as scheduled."
                    : "You have a gap on Wednesday afternoon. Tuesday's post is performing well, consider a follow-up story for then."}
                </p>
              </div>

              {!autoPostMode && (
                <button 
                  onClick={() => onAction('Generating optimized gap-fillers...')}
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
                { label: 'LinkedIn', count: sortedPosts.filter(p => p.platform === 'LinkedIn').length, color: 'bg-blue-500' },
                { label: 'X (Twitter)', count: sortedPosts.filter(p => p.platform === 'X (Twitter)').length, color: 'bg-slate-900' },
                { label: 'Facebook', count: sortedPosts.filter(p => p.platform === 'Facebook').length, color: 'bg-blue-700' },
                { label: 'YouTube', count: sortedPosts.filter(p => p.platform === 'YouTube Script').length, color: 'bg-rose-500' }
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
  );
};

export default CalendarView;
