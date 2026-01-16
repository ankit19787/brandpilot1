
import React from 'react';
import { BarChart3, TrendingUp, AlertTriangle, Lightbulb, CheckCircle } from 'lucide-react';
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
}

const PerformanceBrain: React.FC<PerformanceBrainProps> = ({ onNavigate }) => {
  const data = [
    { name: 'Storytelling', engagement: 450, color: '#6366f1' },
    { name: 'How-to Guides', engagement: 210, color: '#6366f1' },
    { name: 'Controversial', engagement: 380, color: '#6366f1' },
    { name: 'Personal', engagement: 520, color: '#f59e0b' },
    { name: 'Productivity', engagement: 120, color: '#ef4444' },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold mb-6">Engagement by Content Category</h2>
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
        </div>

        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl">
            <div className="flex items-center gap-3 text-emerald-700 font-bold mb-3">
              <CheckCircle size={20} />
              <span>What Worked</span>
            </div>
            <p className="text-emerald-900 text-sm leading-relaxed font-medium">
              Posts mentioning "Failures" or "Lessons" got 82% more shares than average. Your audience values authenticity over perfection.
            </p>
          </div>

          <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl">
            <div className="flex items-center gap-3 text-rose-700 font-bold mb-3">
              <AlertTriangle size={20} />
              <span>What Failed</span>
            </div>
            <p className="text-rose-900 text-sm leading-relaxed font-medium">
              Link-heavy posts on X are being suppressed. Try native threads with screenshots instead of outbound links.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl">
            <div className="flex items-center gap-3 text-amber-700 font-bold mb-3">
              <Lightbulb size={20} />
              <span>The Repeatable Flywheel</span>
            </div>
            <p className="text-amber-900 text-sm leading-relaxed font-medium italic">
              "Post on LinkedIn at 8 AM EST, wait 4 hours, then repurpose as an X thread for maximum momentum."
            </p>
          </div>
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
              Based on your current trajectory, you are on track to hit 50k followers by December. 
              Accelerate this by 1.5x by introducing a "Weekly Challenge" series.
            </p>
          </div>
          <button 
            onClick={() => onNavigate('engine', 'Announcement: I am starting a 7-day Weekly Challenge series for my community. Here is how you can participate...')}
            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 whitespace-nowrap active:scale-95"
          >
            Generate Challenge Series
          </button>
        </div>
      </div>
    </div>
  );
};

export default PerformanceBrain;
