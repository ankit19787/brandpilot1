import React from 'react';
import { Lock, Crown, ArrowRight } from 'lucide-react';

interface FeatureGateProps {
  isLocked: boolean;
  requiredPlan: 'pro' | 'business' | 'enterprise';
  featureName: string;
  children: React.ReactNode;
  onUpgrade: () => void;
}

const FeatureGate: React.FC<FeatureGateProps> = ({ 
  isLocked, 
  requiredPlan, 
  featureName, 
  children, 
  onUpgrade 
}) => {
  if (!isLocked) {
    return <>{children}</>;
  }

  const planColors = {
    pro: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600', button: 'bg-indigo-600 hover:bg-indigo-700' },
    business: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', button: 'bg-amber-600 hover:bg-amber-700' },
    enterprise: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', button: 'bg-purple-600 hover:bg-purple-700' }
  };

  const colors = planColors[requiredPlan];

  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="pointer-events-none opacity-30 blur-sm select-none">
        {children}
      </div>

      {/* Overlay */}
      <div className={`absolute inset-0 flex items-center justify-center ${colors.bg} ${colors.border} border-2 rounded-2xl backdrop-blur-sm`}>
        <div className="text-center p-8 max-w-md">
          <div className={`w-16 h-16 ${colors.bg} rounded-full flex items-center justify-center mx-auto mb-4 border-2 ${colors.border}`}>
            <Lock className={colors.text} size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">{featureName}</h3>
          <p className="text-slate-600 mb-6">
            This feature is available on the <span className="font-bold capitalize">{requiredPlan}</span> plan and above.
          </p>
          <button
            onClick={onUpgrade}
            className={`${colors.button} text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 mx-auto`}
          >
            <Crown size={18} />
            Upgrade to {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeatureGate;
