
import React, { useState, useEffect } from 'react';
import { Fingerprint, Loader2, Sparkles, CheckCircle2, MessageSquare, Play, GraduationCap, RotateCcw } from 'lucide-react';
import { analyzeBrandDNA } from '../services/gemini.client';
import { deductCredits } from '../services/creditService';
import { canUseFeature, CREDIT_COSTS } from '../services/planService';
import { BrandDNA as BrandDNAType, SAMPLE_DNA, TUTORING_TIK_DNA } from '../types';
import FeatureGate from './FeatureGate';
import CreditsWarning from './CreditsWarning';

const API_PREFIX = window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api';

interface BrandDNAProps {
  dna: BrandDNAType | null;
  setDna: (dna: BrandDNAType) => void;
  userPlan?: { plan: string; credits: number; maxCredits: number };
  onUpgrade: () => void;
  onCreditsUpdate: (newCredits: number) => void;
  userId?: string;
}

const BrandDNA: React.FC<BrandDNAProps> = ({ dna, setDna, userPlan = { plan: 'free', credits: 0, maxCredits: 1000 }, onUpgrade, onCreditsUpdate, userId }) => {
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  
  const isLocked = !canUseFeature(userPlan.plan, 'brandDNA');
  const hasEnoughCredits = userPlan.credits >= CREDIT_COSTS.brandDNAAnalysis;

  // Load saved DNA on mount
  useEffect(() => {
    if (userId && !dna) {
      loadSavedDNA();
    }
  }, [userId]);

  const loadSavedDNA = async () => {
    try {
      const response = await fetch(`${API_PREFIX}/brand-dna/${userId}`);
      if (response.ok) {
        const savedDNA = await response.json();
        setDna(savedDNA);
      }
    } catch (error) {
      console.log('No saved Brand DNA found');
    }
  };

  const handleAnalyze = async () => {
    if (!input || isLocked) return;
    
    if (!hasEnoughCredits) {
      onUpgrade();
      return;
    }
    
    setLoading(true);
    try {
      // First, check if user has existing active Brand DNA
      if (userId) {
        console.log('📦 Checking for existing Brand DNA in database...');
        const existingResponse = await fetch(`${API_PREFIX}/brand-dna/${userId}`);
        if (existingResponse.ok) {
          const existingData = await existingResponse.json();
          if (existingData.dna) {
            console.log('✅ Found existing Brand DNA, using cached data');
            setDna(existingData.dna);
            setLoading(false);
            return;
          }
        }
      }

      console.log('🚀 No existing data found, generating new Brand DNA with userId:', userId);
      const dnaResult = await analyzeBrandDNA(input, userId);
      
      // Handle response based on whether it includes credit info
      if (dnaResult.credits !== undefined) {
        // Response with credit information (has user context)
        onCreditsUpdate(dnaResult.credits);
        // Remove credits info from the DNA object before setting
        const { credits, creditCost, ...dna } = dnaResult;
        setDna(dna);
      } else {
        // Response without credit info (no user context)
        setDna(dnaResult);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleForceRegenerate = async () => {
    if (!input || isLocked) return;
    
    if (!hasEnoughCredits) {
      onUpgrade();
      return;
    }
    
    setLoading(true);
    try {
      console.log('🔄 Force regenerating Brand DNA...');
      const dnaResult = await analyzeBrandDNA(input, userId);
      setDna(dnaResult);
      
      // Update credits if returned from API
      if (dnaResult.credits !== undefined) {
        onCreditsUpdate(dnaResult.credits);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Add debug logging for userId state
  useEffect(() => {
    console.log('🔍 BrandDNA userId state:', {
      userId,
      hasUserId: !!userId,
      dnaExists: !!dna,
      componentMounted: true
    });
  }, [userId, dna]);

  // Auto-load existing Brand DNA for logged-in users
  useEffect(() => {
    const loadExistingData = async () => {
      // Wait a bit for userId to be properly set and only load if no data exists
      if (!userId || dna) {
        console.log('🔍 BrandDNA auto-load skipped - userId:', !!userId, 'dna exists:', !!dna);
        return;
      }
      
      try {
        console.log('📦 Auto-loading existing Brand DNA for user:', userId);
        const existingResponse = await fetch(`${API_PREFIX}/brand-dna/${userId}`);
        if (existingResponse.ok) {
          const existingData = await existingResponse.json();
          if (existingData.dna) {
            console.log('✅ Auto-loaded existing Brand DNA');
            setDna(existingData.dna);
          } else {
            console.log('📭 No Brand DNA data found in response');
          }
        } else {
          console.log('📭 No existing Brand DNA found (404)');
        }
      } catch (error) {
        console.log('⚠️ Error loading existing Brand DNA:', error);
      }
    };
    
    // Add small delay to ensure userId is properly set
    if (userId) {
      setTimeout(loadExistingData, 100);
    }
  }, [userId, dna]); // Monitor both userId and dna

  const loadSample = (type: 'tech' | 'tutoring') => {
    setLoading(true);
    setTimeout(() => {
      const sampleDNA = type === 'tech' ? SAMPLE_DNA : TUTORING_TIK_DNA;
      // Mark as sample data so other components know this isn't real API data
      const sampleWithFlag = { ...sampleDNA, isSample: true };
      setDna(sampleWithFlag);
      setLoading(false);
    }, 1000);
  };

  return (
    <FeatureGate
      isLocked={isLocked}
      requiredPlan="pro"
      featureName="Brand DNA Analysis"
      onUpgrade={onUpgrade}
    >
      <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
            <Fingerprint size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Brand Intelligence Engine</h1>
            <p className="text-slate-500">Define your unique Brand DNA to power the rest of the OS.</p>
          </div>
        </div>

        <CreditsWarning
          currentCredits={userPlan.credits}
          requiredCredits={CREDIT_COSTS.brandDNAAnalysis}
          action="analyze your brand DNA"
          onUpgrade={onUpgrade}
        />

        {!dna ? (
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm text-center">
          <div className="max-w-xl mx-auto space-y-8">
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900">Select or Analyze a Voice</h2>
              <p className="text-slate-500">Paste your top-performing posts or try a demo brand to see how BrandPilot works.</p>
            </div>
            
            <div className="flex flex-col gap-4">
              <textarea
                className="w-full h-48 p-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none text-slate-700 text-sm font-medium leading-relaxed"
                placeholder="Paste your past social media posts here to analyze your voice..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleAnalyze}
                  disabled={loading || !input}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 disabled:opacity-50 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                >
                  {loading && !dna ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                  Analyze Custom Voice
                </button>
                
                <div className="flex flex-col gap-2">
                   <button
                    onClick={() => loadSample('tutoring')}
                    disabled={loading}
                    className="w-full py-4 bg-white text-indigo-600 border-2 border-indigo-100 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-50 transition-all active:scale-[0.98]"
                  >
                    <GraduationCap size={18} />
                    Try TutoringTik Voice
                  </button>
                  <button
                    onClick={() => loadSample('tech')}
                    disabled={loading}
                    className="w-full py-2 bg-slate-50 text-slate-400 border border-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-100 transition-all"
                  >
                    <Play size={12} fill="currentColor" />
                    Try Tech Founder Sample
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CheckCircle2 className="text-emerald-500" />
                Brand Identity
              </h2>
              <button
                onClick={handleForceRegenerate}
                disabled={loading || !input}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-medium text-sm transition-all disabled:opacity-50"
                title="Generate fresh analysis"
              >
                <RotateCcw size={14} />
                Refresh
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Voice & Tone</label>
                <p className="text-lg text-slate-800 font-semibold leading-snug">{dna.voice}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Writing Style</label>
                <p className="text-slate-600 leading-relaxed font-medium">{dna.writingStyle}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Personality Traits</label>
                <div className="flex flex-wrap gap-2">
                  {(dna.personality || []).map((trait, i) => (
                    <span key={i} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold border border-indigo-100 uppercase tracking-tight">
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MessageSquare className="text-indigo-500" />
              Content Strategy DNA
            </h2>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Primary Audience</label>
                <p className="text-lg text-slate-800 font-semibold leading-snug">{dna.audienceType}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Core Pillars</label>
                <ul className="space-y-3">
                  {(dna.contentPillars || []).map((pillar, i) => (
                    <li key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 font-semibold hover:border-indigo-200 transition-colors">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
                      {pillar}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="pt-4">
              <button 
                onClick={() => setDna(null as any)}
                className="text-slate-400 text-xs font-bold hover:text-rose-500 transition-colors flex items-center gap-2"
              >
                Reset Brand Intelligence
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </FeatureGate>
  );
};

export default BrandDNA;
