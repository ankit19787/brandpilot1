import React from 'react';
import { AlertCircle, Crown, ArrowRight } from 'lucide-react';

interface CreditsWarningProps {
  currentCredits: number;
  requiredCredits: number;
  action: string;
  onUpgrade: () => void;
}

const CreditsWarning: React.FC<CreditsWarningProps> = ({ 
  currentCredits, 
  requiredCredits, 
  action,
  onUpgrade 
}) => {
  const isInsufficient = currentCredits < requiredCredits;

  if (!isInsufficient) return null;

  return (
    <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <AlertCircle className="text-amber-600" size={20} />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-slate-900 mb-1">Insufficient Credits</h4>
          <p className="text-sm text-slate-600 mb-3">
            You need <span className="font-bold">{requiredCredits} credits</span> to {action}, 
            but you only have <span className="font-bold">{currentCredits} credits</span> remaining.
          </p>
          <button
            onClick={onUpgrade}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2"
          >
            <Crown size={16} />
            Upgrade Plan for More Credits
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreditsWarning;
