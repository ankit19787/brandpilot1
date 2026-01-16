
import React from 'react';
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  ChevronRight,
  Zap,
  Star,
  Sparkles,
  GraduationCap
} from 'lucide-react';
import { 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { ActiveTab } from '../types';

const data = [
  { name: 'Mon', reach: 4000, engagement: 2400 },
  { name: 'Tue', reach: 3000, engagement: 1398 },
  { name: 'Wed', reach: 2000, engagement: 9800 },
  { name: 'Thu', reach: 2780, engagement: 3908 },
  { name: 'Fri', reach: 1890, engagement: 4800 },
  { name: 'Sat', reach: 2390, engagement: 3800 },
  { name: 'Sun', reach: 3490, engagement: 4300 },
];

interface DashboardProps {
  onNavigate: (tab: ActiveTab, topic: string) => void;
  hasDNA: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, hasDNA }) => {
  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, Creator!</h1>
          <p className="text-slate-500 mt-1">Your brand is growing 12% faster than last week.</p>
        </div>
        <button 
          onClick={() => onNavigate('engine', '')}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all"
        >
          <Zap size={18} />
          Quick Post
        </button>
      </header>

      {!hasDNA ? (
        <div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute -left-10 -bottom-10 opacity-10">
            <Sparkles size={200} />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">Unleash TutoringTik.com</h2>
            <p className="text-indigo-100 max-w-lg">
              Automate your student engagement strategy. Load the TutoringTik DNA to see how we transform math hacks into viral growth.
            </p>
          </div>
          <button 
            onClick={() => onNavigate('dna', '')}
            className="bg-white text-indigo-600 px-8 py-3 rounded-2xl font-bold hover:bg-indigo-50 transition-all shadow-lg relative z-10 whitespace-nowrap active:scale-95 flex items-center gap-2"
          >
            <GraduationCap size={20} /> Launch TutoringTik OS
          </button>
        </div>
      ) : (
        <div className="bg-white border border-indigo-100 rounded-3xl p-6 flex items-center justify-between shadow-sm">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
               <GraduationCap size={24} />
             </div>
             <div>
               <h2 className="font-bold text-slate-900">TutoringTik Voice Profile Active</h2>
               <p className="text-sm text-slate-500">AI is currently optimized for Student-Focused mentorship.</p>
             </div>
           </div>
           <button 
             onClick={() => onNavigate('strategist', '')}
             className="text-indigo-600 font-bold text-sm hover:underline"
           >
             View Weekly Study Strategy
           </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Reach', value: '1.2M', growth: '+14%', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'New Followers', value: '24.5k', growth: '+8%', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50' },
          { label: 'Avg Engagement', value: '4.8%', growth: '+2.1%', icon: MessageSquare, color: 'text-rose-500', bg: 'bg-rose-50' },
          { label: 'Growth Score', value: '92/100', growth: 'Elite', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
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
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-slate-900">Reach Analytics</h2>
            <select className="bg-slate-50 border-none text-slate-600 text-sm font-medium py-1 px-3 rounded-lg focus:ring-0 cursor-pointer">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
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
                <Area type="monotone" dataKey="reach" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorReach)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles size={120} />
          </div>
          <h2 className="text-xl font-bold mb-2">AI Strategy Insight</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Your "Quick Math Hacks" series is seeing a 3.4x higher conversion rate to free trial signups. Schedule a 'Calculator Tricks' thread for Tuesday.
          </p>
          <div className="space-y-4 mt-auto">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">Top Hook Suggested</p>
              <p className="text-sm font-medium">"99% of students solve algebra the slow way. Here's the TutoringTik trick..."</p>
            </div>
            <button 
              onClick={() => onNavigate('engine', '99% of students solve algebra the slow way. Here is the TutoringTik trick that saves you 2 minutes per question...')}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-500 transition-colors shadow-lg active:scale-95"
            >
              Apply Strategy <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
