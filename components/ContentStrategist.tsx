
import React, { useState, useEffect } from 'react';
import { Compass, Calendar, Target, Zap, Loader2, ArrowRight } from 'lucide-react';
import { generateContentStrategy } from '../services/gemini.client';
import { deductCredits } from '../services/creditService';
import { canUseFeature, CREDIT_COSTS } from '../services/planService';
import { BrandDNA, ContentStrategy, ActiveTab } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import FeatureGate from './FeatureGate';
import CreditsWarning from './CreditsWarning';

interface ContentStrategistProps {
  dna: BrandDNA | null;
  onNavigate: (tab: ActiveTab, topic: string) => void;
  userPlan?: { plan: string; credits: number; maxCredits: number };
  onUpgrade: () => void;
  onCreditsUpdate: (newCredits: number) => void;
}

const ContentStrategist: React.FC<ContentStrategistProps> = ({ dna, onNavigate, userPlan = { plan: 'free', credits: 0, maxCredits: 1000 }, onUpgrade, onCreditsUpdate }) => {
  const [strategy, setStrategy] = useState<ContentStrategy | null>(null);
  const [loading, setLoading] = useState(false);
  
  const isLocked = !canUseFeature(userPlan.plan, 'contentStrategy');
  const hasEnoughCredits = userPlan.credits >= CREDIT_COSTS.contentStrategy;

  useEffect(() => {
    if (dna && !strategy && !isLocked) {
      handleGenerate();
    }
  }, [dna]);

  const handleGenerate = async () => {
    if (!dna || isLocked) return;
    
    if (!hasEnoughCredits) {
      onUpgrade();
      return;
    }
    
    setLoading(true);
    try {
      const result = await deductCredits('default_user', CREDIT_COSTS.contentStrategy, 'Content Strategy');
      onCreditsUpdate(result.credits);
      
      const strategyResult = await generateContentStrategy(dna);
      setStrategy(strategyResult);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!dna) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
        <div className="bg-slate-100 p-6 rounded-full mb-6">
          <Compass className="text-slate-400" size={48} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Define your DNA first</h2>
        <p className="text-slate-500 max-w-sm mt-2">
          We need to know your brand's voice and pillars before we can build a strategy.
        </p>
        <button 
          onClick={() => onNavigate('dna', '')}
          className="mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
        >
          Setup Brand DNA
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
        <p className="text-slate-500 font-medium animate-pulse">Architecting your weekly strategy...</p>
      </div>
    );
  }

  const chartData = strategy ? [
    { name: 'Storytelling', value: strategy.recommendedMix.storytelling, color: '#6366f1' },
    { name: 'Authority', value: strategy.recommendedMix.authority, color: '#0ea5e9' },
    { name: 'CTA/Sales', value: strategy.recommendedMix.cta, color: '#10b981' },
  ] : [];

  return (
    <FeatureGate
      isLocked={isLocked}
      requiredPlan="pro"
      featureName="AI Content Strategist"
      onUpgrade={onUpgrade}
    >
      <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
              <Compass size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">AI Content Strategist</h1>
              <p className="text-slate-500">Personalized growth roadmap based on your Brand DNA.</p>
            </div>
          </div>
          <button 
            onClick={handleGenerate}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-slate-50 flex items-center gap-2 transition-all"
          >
            <Zap size={18} className="text-indigo-500" /> Refresh Strategy
          </button>
        </div>

        <CreditsWarning
          currentCredits={userPlan.credits}
          requiredCredits={CREDIT_COSTS.contentStrategy}
          action="generate a content strategy"
          onUpgrade={onUpgrade}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Calendar className="text-indigo-500" />
              Weekly Strategic focus
            </h2>
            <div className="prose prose-indigo max-w-none">
              <p className="text-slate-700 leading-relaxed text-lg whitespace-pre-wrap">
                {strategy?.dailyStrategy}
              </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Target className="text-indigo-500" />
              High-Impact Hooks
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {strategy?.suggestedHooks.map((hook, i) => (
                <div 
                  key={i} 
                  onClick={() => onNavigate('engine', hook)}
                  className="group p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all cursor-pointer"
                >
                  <p className="text-slate-800 font-medium italic mb-3">"{hook}"</p>
                  <button className="text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                    Generate Post <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold mb-6">Content Mix Recommendation</h2>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-4">
              {chartData.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-lg shadow-indigo-500/20">
            <h3 className="font-bold text-lg mb-2">Platform Focus</h3>
            <div className="space-y-4 mt-6">
              {strategy?.platformFocus.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold">
                    {i + 1}
                  </div>
                  <span className="font-medium">{p}</span>
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

export default ContentStrategist;
