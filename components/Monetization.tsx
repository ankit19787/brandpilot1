
import React, { useState, useEffect } from 'react';
import { Coins, Target, ArrowUpRight, Loader2, Sparkles, DollarSign } from 'lucide-react';
import { getMonetizationPlan } from '../services/gemini.client';
import { deductCredits } from '../services/creditService';
import { canUseFeature, CREDIT_COSTS } from '../services/planService';
import { BrandDNA, MonetizationIdea } from '../types';
import FeatureGate from './FeatureGate';
import CreditsWarning from './CreditsWarning';

interface MonetizationProps {
  dna: BrandDNA | null;
  onAction: (msg: string, type?: 'success' | 'info') => void;
  userPlan?: { plan: string; credits: number; maxCredits: number };
  onUpgrade: () => void;
  onCreditsUpdate: (newCredits: number) => void;
}

const Monetization: React.FC<MonetizationProps> = ({ dna, onAction, userPlan = { plan: 'free', credits: 0, maxCredits: 1000 }, onUpgrade, onCreditsUpdate }) => {
  const [plans, setPlans] = useState<MonetizationIdea[]>([]);
  const [loading, setLoading] = useState(false);
  
  const isLocked = !canUseFeature(userPlan.plan, 'monetization');
  const hasEnoughCredits = userPlan.credits >= CREDIT_COSTS.monetizationPlan;

  useEffect(() => {
    if (dna && plans.length === 0 && !isLocked) {
      handleFetchPlans();
    }
  }, [dna]);

  const handleFetchPlans = async () => {
    if (!dna || isLocked) return;
    
    if (!hasEnoughCredits) {
      onUpgrade();
      return;
    }
    
    setLoading(true);
    try {
      const result = await deductCredits('default_user', CREDIT_COSTS.monetizationPlan, 'Monetization Plan');
      onCreditsUpdate(result.credits);
      
      const metrics = { currentFollowers: 25000, engagement: 4.8 };
      const planResult = await getMonetizationPlan(dna, metrics);
      setPlans(planResult);
    } catch (error) {
      console.error(error);
      onAction('Failed to fetch monetization plans.');
    } finally {
      setLoading(false);
    }
  };

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
            <Sparkles size={18} /> Regenerate Plan
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
            <p className="text-2xl font-bold text-slate-900">$12,400/mo</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Target />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Audience Maturity</p>
            <p className="text-2xl font-bold text-slate-900">High Trust</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <ArrowUpRight />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Funnel Efficiency</p>
            <p className="text-2xl font-bold text-slate-900">72%</p>
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
          {plans.map((plan, i) => (
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
            "Your audience is engaging heavily with your 'Automation' tips. This is the perfect time to launch a $49 mini-course or Notion template about your workflow."
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
