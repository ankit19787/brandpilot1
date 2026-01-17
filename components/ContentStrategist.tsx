
import React, { useState, useEffect } from 'react';
import { Compass, Calendar, Target, Zap, Loader2, ArrowRight } from 'lucide-react';
import { generateContentStrategy } from '../services/gemini.client';
import { deductCredits } from '../services/creditService';
import { canUseFeature, CREDIT_COSTS } from '../services/planService';
import { BrandDNA, ContentStrategy, ActiveTab } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import FeatureGate from './FeatureGate';
import CreditsWarning from './CreditsWarning';

const API_PREFIX = window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api';

interface ContentStrategistProps {
  dna: BrandDNA | null;
  onNavigate: (tab: ActiveTab, topic: string) => void;
  userPlan?: { plan: string; credits: number; maxCredits: number };
  onUpgrade: () => void;
  onCreditsUpdate: (newCredits: number) => void;
  userId?: string;
}

const ContentStrategist: React.FC<ContentStrategistProps> = ({ dna, onNavigate, userPlan = { plan: 'free', credits: 0, maxCredits: 1000 }, onUpgrade, onCreditsUpdate, userId }) => {
  const [strategy, setStrategy] = useState<ContentStrategy | null>(null);
  const [loading, setLoading] = useState(false);

  const getAuthHeaders = () => {
    const authData = JSON.parse(localStorage.getItem('brandpilot_auth') || '{}');
    return {
      'Content-Type': 'application/json',
      ...(authData.token ? { 'Authorization': `Bearer ${authData.token}` } : {})
    };
  };
  
  const isLocked = !canUseFeature(userPlan.plan, 'contentStrategy');
  const hasEnoughCredits = userPlan.credits >= CREDIT_COSTS.contentStrategy;

  // Load saved strategy on mount
  useEffect(() => {
    if (userId && !strategy) {
      loadSavedStrategy();
    }
  }, [userId]);

  const loadSavedStrategy = async () => {
    try {
      const authData = JSON.parse(localStorage.getItem('brandpilot_auth') || '{}');
      const headers: HeadersInit = {};
      if (authData.token) {
        headers['Authorization'] = `Bearer ${authData.token}`;
      }
      const response = await fetch(`${API_PREFIX}/content-strategy/${userId}`, { headers });
      if (response.ok) {
        const savedStrategy = await response.json();
        setStrategy(savedStrategy);
      }
    } catch (error) {
      console.log('No saved strategy found');
    }
  };

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
      // First, check if user has existing active Content Strategy
      if (userId) {
        console.log('📦 Checking for existing Content Strategy in database...');
        const authData = JSON.parse(localStorage.getItem('brandpilot_auth') || '{}');
        const headers: HeadersInit = {};
        if (authData.token) {
          headers['Authorization'] = `Bearer ${authData.token}`;
        }
        const existingResponse = await fetch(`${API_PREFIX}/content-strategy/${userId}`, { headers });
        if (existingResponse.ok) {
          const existingData = await existingResponse.json();
          if (existingData.strategy) {
            console.log('✅ Found existing Content Strategy, using cached data');
            console.log('📊 Strategy object structure:', existingData.strategy);
            console.log('📊 RecommendedMix:', existingData.strategy.recommendedMix);
            setStrategy(existingData.strategy);
            setLoading(false);
            return;
          }
        }
      }

      console.log('🚀 No existing strategy found, generating new Content Strategy with userId:', userId);
      const strategyResult = await generateContentStrategy(dna, userId);
      console.log('✅ Content strategy received:', strategyResult);
      
      // Handle response based on whether it includes credit info
      if (strategyResult.credits !== undefined) {
        // Response with credit information (has user context)
        onCreditsUpdate(strategyResult.credits);
        // Remove credits info from the strategy object before setting
        const { credits, creditCost, ...strategy } = strategyResult;
        setStrategy(strategy);
      } else {
        // Response without credit info (no user context)
        setStrategy(strategyResult);
      }
      
    } catch (error) {
      console.error('Content strategy error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add debug logging for userId state
  useEffect(() => {
    console.log('🔍 ContentStrategist userId state:', {
      userId,
      hasUserId: !!userId,
      dnaExists: !!dna,
      strategyExists: !!strategy,
      componentMounted: true
    });
  }, [userId, dna, strategy]);

  // Auto-load existing Content Strategy for logged-in users
  useEffect(() => {
    const loadExistingStrategy = async () => {
      if (!userId || strategy) {
        console.log('🔍 ContentStrategy auto-load skipped - userId:', !!userId, 'strategy exists:', !!strategy);
        return;
      }
      
      // Try to load strategy even without dna first, in case user has existing data
      try {
        console.log('📦 Auto-loading existing Content Strategy for user:', userId);
        const authData = JSON.parse(localStorage.getItem('brandpilot_auth') || '{}');
        const headers: HeadersInit = {};
        if (authData.token) {
          headers['Authorization'] = `Bearer ${authData.token}`;
        }
        const existingResponse = await fetch(`${API_PREFIX}/content-strategy/${userId}`, { headers });
        if (existingResponse.ok) {
          const existingData = await existingResponse.json();
          if (existingData.strategy) {
            console.log('✅ Auto-loaded existing Content Strategy');
            console.log('📊 Strategy object structure:', existingData.strategy);
            console.log('📊 RecommendedMix:', existingData.strategy.recommendedMix);
            setStrategy(existingData.strategy);
          } else {
            console.log('📭 No Content Strategy data found in response');
          }
        } else {
          console.log('📭 No existing Content Strategy found (404)');
        }
      } catch (error) {
        console.log('⚠️ Error loading existing Content Strategy:', error);
      }
    };
    
    // Add small delay to ensure userId is properly set
    if (userId) {
      setTimeout(loadExistingStrategy, 200);
    }
  }, [userId, strategy]); // Monitor userId and strategy, not dna

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

  const chartData = strategy && strategy.recommendedMix ? [
    { name: 'Storytelling', value: strategy.recommendedMix.storytelling || 0, color: '#6366f1' },
    { name: 'Authority', value: strategy.recommendedMix.authority || 0, color: '#0ea5e9' },
    { name: 'CTA/Sales', value: strategy.recommendedMix.cta || 0, color: '#10b981' },
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
            <Zap size={18} className="text-indigo-500" /> {strategy ? 'Refresh Strategy' : 'Generate Strategy'}
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
              {(strategy?.suggestedHooks || []).map((hook, i) => (
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
              {(strategy?.platformFocus || []).map((p, i) => (
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
