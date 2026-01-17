
import React, { useState, useEffect } from 'react';
import { Coins, Target, ArrowUpRight, Loader2, Sparkles, DollarSign } from 'lucide-react';
import { getMonetizationPlan } from '../services/gemini.client';
import { deductCredits } from '../services/creditService';
import { canUseFeature, CREDIT_COSTS } from '../services/planService';
import { BrandDNA, MonetizationIdea } from '../types';
import FeatureGate from './FeatureGate';
import CreditsWarning from './CreditsWarning';

const API_PREFIX = window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api';

interface MonetizationProps {
  dna: BrandDNA | null;
  onAction: (msg: string, type?: 'success' | 'info') => void;
  userPlan?: { plan: string; credits: number; maxCredits: number };
  onUpgrade: () => void;
  onCreditsUpdate: (newCredits: number) => void;
  userId?: string;
}

const Monetization: React.FC<MonetizationProps> = ({ dna, onAction, userPlan = { plan: 'free', credits: 0, maxCredits: 1000 }, onUpgrade, onCreditsUpdate, userId }) => {
  const [plans, setPlans] = useState<MonetizationIdea[]>([]);
  const [loading, setLoading] = useState(false);

  const getAuthHeaders = () => {
    const authData = JSON.parse(localStorage.getItem('brandpilot_auth') || '{}');
    return {
      'Content-Type': 'application/json',
      ...(authData.token ? { 'Authorization': `Bearer ${authData.token}` } : {})
    };
  };
  
  const isLocked = !canUseFeature(userPlan.plan, 'monetization');
  const hasEnoughCredits = userPlan.credits >= CREDIT_COSTS.monetizationPlan;

  // Load saved monetization plan on mount
  useEffect(() => {
    console.log('🔄 Monetization useEffect - userId:', userId, 'plans.length:', plans.length);
    if (userId && plans.length === 0) {
      loadSavedPlan();
    }
  }, [userId]);

  const loadSavedPlan = async () => {
    console.log('📥 Loading saved monetization plan for userId:', userId);
    try {
      const authData = JSON.parse(localStorage.getItem('brandpilot_auth') || '{}');
      const headers: HeadersInit = {};
      if (authData.token) {
        headers['Authorization'] = `Bearer ${authData.token}`;
      }
      const response = await fetch(`${API_PREFIX}/monetization-plan/${userId}`, { headers });
      console.log('📥 Load response status:', response.status);
      if (response.ok) {
        const savedPlan = await response.json();
        console.log('✅ Loaded saved plan:', savedPlan);
        setPlans(savedPlan);
      }
    } catch (error) {
      console.log('ℹ️ No saved monetization plan found:', error.message);
    }
  };

  useEffect(() => {
    if (dna && plans.length === 0 && !isLocked) {
      if (dna.isSample) {
        console.log('⚠️ Detected sample DNA data - showing demo monetization plans');
        // For sample data, show demo plans instead of calling API
        const demoPlans = [
          {
            title: 'Sample Monetization Plan',
            description: 'This is a demo plan. Generate real Brand DNA to get personalized monetization strategies.',
            monetization_model: 'Demo',
            pillar_alignment: 'Sample',
            effort_level: 'Low'
          }
        ];
        setPlans(demoPlans);
      } else {
        handleFetchPlans();
      }
    }
  }, [dna]);

  const handleFetchPlans = async () => {
    if (!dna || isLocked) return;
    
    if (!hasEnoughCredits) {
      onUpgrade();
      return;
    }
    
    console.log('🔍 Monetization Debug - userId:', userId, 'dna:', !!dna);
    
    setLoading(true);
    try {
      // First, check if user has existing active Monetization Plan
      if (userId) {
        console.log('📦 Checking for existing Monetization Plan in database...');
        const authData = JSON.parse(localStorage.getItem('brandpilot_auth') || '{}');
        const headers: HeadersInit = {};
        if (authData.token) {
          headers['Authorization'] = `Bearer ${authData.token}`;
        }
        const existingResponse = await fetch(`${API_PREFIX}/monetization-plan/${userId}`, { headers });
        if (existingResponse.ok) {
          const existingData = await existingResponse.json();
          if (existingData.plans && Array.isArray(existingData.plans)) {
            console.log('✅ Found existing Monetization Plan, using cached data');
            console.log('📊 Cached plans count:', existingData.plans.length);
            setPlans(existingData.plans);
            setLoading(false);
            return;
          } else {
            console.log('⚠️ Existing data found but plans is not an array:', existingData);
          }
        }
      }

      const metrics = { currentFollowers: 25000, engagement: 4.8 };
      console.log('🚀 No existing plans found, generating new Monetization Plan with userId:', userId);
      const planResult = await getMonetizationPlan(dna, metrics, userId);
      console.log('✅ Monetization plan received:', planResult);
      console.log('📊 Plan result type:', typeof planResult);
      console.log('📊 Is array:', Array.isArray(planResult));
      console.log('📊 Has plans property:', planResult && typeof planResult === 'object' && 'plans' in planResult);
      
      // Handle response based on whether it includes credit info
      if (Array.isArray(planResult)) {
        // Simple array response (no user context)
        console.log('📊 Setting plans from array response');
        setPlans(planResult);
      } else if (planResult && planResult.plans && Array.isArray(planResult.plans)) {
        // Response with credit information (has user context) - new format
        console.log('📊 Setting plans from object response with plans array');
        setPlans(planResult.plans);
        if (planResult.credits !== undefined) {
          onCreditsUpdate(planResult.credits);
        }
      } else {
        // Fallback - ensure we always have an array
        console.warn('Unexpected response format:', planResult);
        setPlans([]);
      }
      
    } catch (error: any) {
      console.error('❌ Monetization plan error:', error);
      onAction(`Failed to generate monetization plan: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Calculate dynamic metrics based on user data
  const calculateMetrics = () => {
    if (!dna) return { revenue: '$0', maturity: 'Unknown', efficiency: '0%' };
    
    // Base calculations on Brand DNA personality and audience
    const followerCount = 25000; // This could come from connected social accounts
    const engagement = 4.8;
    
    // Calculate revenue potential based on personality traits and engagement
    const personalityStrength = (dna.personality || []).length;
    const baseRevenue = Math.floor((followerCount * engagement * personalityStrength) / 100);
    const revenueRange = `$${(baseRevenue * 0.8).toLocaleString()}-${(baseRevenue * 1.2).toLocaleString()}/mo`;
    
    // Determine audience maturity based on Brand DNA voice
    const voice = dna.voice || '';
    let maturity = 'Building Trust';
    if (voice.toLowerCase().includes('authentic') || voice.toLowerCase().includes('expert')) {
      maturity = 'High Trust';
    } else if (voice.toLowerCase().includes('professional') || voice.toLowerCase().includes('authority')) {
      maturity = 'Authority';
    }
    
    // Calculate funnel efficiency based on content pillars
    const pillarsCount = (dna.contentPillars || []).length;
    const efficiency = Math.min(95, Math.max(45, 60 + (pillarsCount * 8)));
    
    return {
      revenue: revenueRange,
      maturity,
      efficiency: `${efficiency}%`
    };
  };

  const metrics = calculateMetrics();

  // Generate dynamic "Next Best Move" recommendation
  const generateNextBestMove = () => {
    if (!dna || !dna.contentPillars || dna.contentPillars.length === 0) {
      return "Build your Brand DNA first to unlock personalized monetization recommendations.";
    }
    
    // Pick the most relevant content pillar (first one or random selection)
    const topPillar = dna.contentPillars[0];
    const pillars = dna.contentPillars;
    
    // Generate price point based on audience maturity
    const pricePoint = metrics.maturity === 'High Trust' ? '$97' : 
                      metrics.maturity === 'Authority' ? '$67' : '$39';
    
    // Create different recommendation templates based on content pillars
    const recommendations = [
      `Your audience is engaging heavily with your '${topPillar}' content. This is the perfect time to launch a ${pricePoint} mini-course or digital guide.`,
      `Your '${topPillar}' expertise is resonating! Consider creating a ${pricePoint} masterclass or template bundle.`,
      `High engagement on '${topPillar}' suggests your audience wants more. Launch a ${pricePoint} deep-dive course or consultation package.`,
      `Your '${topPillar}' content is hitting! Time for a ${pricePoint} premium resource or exclusive community access.`
    ];
    
    // Select recommendation based on number of pillars (for consistency)
    const recommendationIndex = pillars.length % recommendations.length;
    return recommendations[recommendationIndex];
  };

  const nextBestMove = generateNextBestMove();

  // Add debug logging for userId state
  useEffect(() => {
    console.log('🔍 Monetization userId state:', {
      userId,
      hasUserId: !!userId,
      dnaExists: !!dna,
      plansCount: plans.length,
      componentMounted: true
    });
  }, [userId, dna, plans.length]);

  // Auto-load existing Monetization Plans for logged-in users
  useEffect(() => {
    const loadExistingPlans = async () => {
      if (!userId || plans.length > 0) {
        console.log('🔍 Monetization auto-load skipped - userId:', !!userId, 'plans exist:', plans.length > 0);
        return;
      }
      
      // Try to load plans even without dna first, in case user has existing data
      try {
        console.log('📦 Auto-loading existing Monetization Plans for user:', userId);
        const authData = JSON.parse(localStorage.getItem('brandpilot_auth') || '{}');
        const headers: HeadersInit = {};
        if (authData.token) {
          headers['Authorization'] = `Bearer ${authData.token}`;
        }
        const existingResponse = await fetch(`${API_PREFIX}/monetization-plan/${userId}`, { headers });
        if (existingResponse.ok) {
          const existingData = await existingResponse.json();
          if (existingData.plans && Array.isArray(existingData.plans)) {
            console.log('✅ Auto-loaded existing Monetization Plans');
            console.log('📊 Plans count:', existingData.plans.length);
            setPlans(existingData.plans);
          } else {
            console.log('📭 No Monetization Plans data found in response');
          }
        } else {
          console.log('📭 No existing Monetization Plans found (404)');
        }
      } catch (error) {
        console.log('⚠️ Error loading existing Monetization Plans:', error);
      }
    };
    
    // Add small delay to ensure userId is properly set
    if (userId) {
      setTimeout(loadExistingPlans, 300);
    }
  }, [userId, plans.length]); // Monitor userId and plans length

  if (!dna) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
        <div className="bg-slate-100 p-6 rounded-full mb-6 text-slate-400">
          <Coins size={48} />
        </div>
        <h2 className="text-2xl font-bold">Monetization requires a Brand DNA</h2>
        <p className="text-slate-500 max-w-sm mt-2">Set up your brand intelligence first to get custom product and funnel ideas.</p>
      </div>
    );
  }

  return (
    <FeatureGate
      isLocked={isLocked}
      requiredPlan="pro"
      featureName="Monetization Planner"
      onUpgrade={onUpgrade}
    >
      <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
              <Coins size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Monetization Planner</h1>
              <p className="text-slate-500">Strategic funnels based on your current audience maturity.</p>
            </div>
          </div>
          <button 
            onClick={handleFetchPlans}
            disabled={loading || isLocked || !hasEnoughCredits}
            className="flex items-center gap-2 text-indigo-600 font-bold hover:bg-indigo-50 px-4 py-2 rounded-xl transition-all disabled:opacity-50"
          >
            <Sparkles size={18} /> {plans.length > 0 ? 'Refresh Plans' : 'Generate Plans'}
          </button>
        </div>

        <CreditsWarning
          currentCredits={userPlan.credits}
          requiredCredits={CREDIT_COSTS.monetizationPlan}
          action="generate monetization plans"
          onUpgrade={onUpgrade}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <DollarSign />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Est. Revenue Potential</p>
            <p className="text-2xl font-bold text-slate-900">{metrics.revenue}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Target />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Audience Maturity</p>
            <p className="text-2xl font-bold text-slate-900">{metrics.maturity}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <ArrowUpRight />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Funnel Efficiency</p>
            <p className="text-2xl font-bold text-slate-900">{metrics.efficiency}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-indigo-600 mb-4" size={32} />
          <p className="text-slate-500">Calculating monetization models...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {(Array.isArray(plans) ? plans : []).map((plan, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col hover:shadow-lg transition-all border-t-4 border-t-indigo-500">
              <div className="flex justify-between items-start mb-6">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                  plan.readiness === 'High' ? 'bg-emerald-100 text-emerald-700' : 
                  plan.readiness === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  {plan.readiness} Readiness
                </span>
                <p className="text-indigo-600 font-bold">{plan.estimatedRevenue}</p>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{plan.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-1">
                {plan.description}
              </p>
              <button 
                onClick={() => onAction(`Activating ${plan.title} funnel...`, 'success')}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                Launch Funnel <ArrowUpRight size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-indigo-900 p-10 rounded-3xl text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
          <Coins size={200} />
        </div>
        <div className="max-w-2xl relative z-10">
          <h2 className="text-2xl font-bold mb-4">The Next Best Move</h2>
          <p className="text-indigo-200 text-lg leading-relaxed mb-6 font-medium italic">
            "{nextBestMove}"
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => onAction('Generating optimized landing page...', 'success')}
              className="bg-white text-indigo-900 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-all shadow-lg"
            >
              Create Landing Page
            </button>
            <button 
              onClick={() => onAction('Drafting high-conversion launch thread...', 'success')}
              className="bg-indigo-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all border border-indigo-700"
            >
              Write Launch Thread
            </button>
          </div>
        </div>
      </div>
    </div>
    </FeatureGate>
  );
};

export default Monetization;
