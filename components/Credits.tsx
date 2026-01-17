import React, { useState, useEffect } from 'react';
import { Coins, TrendingUp, TrendingDown, RefreshCw, Sparkles, Image, FileText, Calendar } from 'lucide-react';

interface CreditTransaction {
  id: string;
  amount: number;
  action: string;
  description: string | null;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
}

interface CreditsProps {
  onAction: (msg: string, type?: 'success' | 'info') => void;
}

const Credits: React.FC<CreditsProps> = ({ onAction }) => {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCredits, setCurrentCredits] = useState(0);
  const [maxCredits, setMaxCredits] = useState(0);
  const [plan, setPlan] = useState('free');

  useEffect(() => {
    fetchCreditsData();
  }, []);

  const fetchCreditsData = async () => {
    try {
      const authData = JSON.parse(localStorage.getItem('brandpilot_auth') || '{}');
      const userId = authData.userId;

      if (!userId) {
        onAction('Please login to view credits', 'info');
        return;
      }

      // Fetch current credits
      const creditsRes = await fetch(`http://localhost:3001/api/user/${userId}/credits`, {
        headers: { 'Authorization': `Bearer ${authData.token}` }
      });

      if (creditsRes.ok) {
        const creditsData = await creditsRes.json();
        setCurrentCredits(creditsData.credits);
        setMaxCredits(creditsData.maxCredits);
        setPlan(creditsData.plan);
      }

      // Fetch transaction history
      const historyRes = await fetch(`http://localhost:3001/api/user/${userId}/credit-history`, {
        headers: { 'Authorization': `Bearer ${authData.token}` }
      });

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setTransactions(historyData.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
      onAction('Failed to load credits data', 'info');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'brand_dna':
        return <Sparkles size={16} className="text-purple-500" />;
      case 'content_generation':
        return <FileText size={16} className="text-blue-500" />;
      case 'image_generation':
        return <Image size={16} className="text-green-500" />;
      case 'post_published':
        return <TrendingUp size={16} className="text-indigo-500" />;
      case 'monthly_reset':
        return <RefreshCw size={16} className="text-orange-500" />;
      default:
        return <Coins size={16} className="text-slate-500" />;
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      brand_dna: 'Brand DNA Analysis',
      content_generation: 'Content Generation',
      image_generation: 'Image Generation',
      post_published: 'Post Published',
      monthly_reset: 'Monthly Reset',
      plan_upgrade: 'Plan Upgrade',
      credit_purchase: 'Credit Purchase'
    };
    return labels[action] || action;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const creditsPercentage = maxCredits > 0 ? (currentCredits / maxCredits) * 100 : 0;
  const getProgressColor = () => {
    if (creditsPercentage > 50) return 'bg-green-500';
    if (creditsPercentage > 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
            <Coins size={28} />
          </div>
          Credits & Usage
        </h2>
      </div>

      {/* Credits Balance Card */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-indigo-100 text-sm font-medium mb-2">Available Credits</p>
            <h3 className="text-5xl font-bold">{currentCredits.toLocaleString()}</h3>
            <p className="text-indigo-200 mt-2">of {maxCredits.toLocaleString()} credits</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
            <p className="text-xs text-indigo-100">Current Plan</p>
            <p className="text-lg font-bold uppercase">{plan}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white/20 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-full ${getProgressColor()} transition-all duration-500`}
            style={{ width: `${creditsPercentage}%` }}
          />
        </div>

        <div className="mt-4 flex justify-between text-sm text-indigo-100">
          <span>{creditsPercentage.toFixed(1)}% remaining</span>
          <span>Resets monthly</span>
        </div>
      </div>

      {/* Credit Costs Reference */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Sparkles size={20} className="text-indigo-600" />
          Credit Costs
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
            <Sparkles size={20} className="text-purple-500" />
            <div>
              <p className="font-bold text-slate-900">Brand DNA</p>
              <p className="text-sm text-slate-600">50 credits</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <FileText size={20} className="text-blue-500" />
            <div>
              <p className="font-bold text-slate-900">Content Generation</p>
              <p className="text-sm text-slate-600">30 credits</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <Image size={20} className="text-green-500" />
            <div>
              <p className="font-bold text-slate-900">Image Generation</p>
              <p className="text-sm text-slate-600">40 credits</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar size={20} className="text-indigo-600" />
            Transaction History
          </h3>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Coins className="text-slate-400" size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No transactions yet</h3>
            <p className="text-slate-500">Your credit usage history will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Action</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Description</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase">Amount</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {formatDate(txn.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getActionIcon(txn.action)}
                        <span className="text-sm font-medium text-slate-900">
                          {getActionLabel(txn.action)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {txn.description || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold ${txn.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {txn.amount > 0 ? '+' : ''}{txn.amount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm">
                        <p className="font-bold text-slate-900">{txn.balanceAfter}</p>
                        <p className="text-xs text-slate-500">from {txn.balanceBefore}</p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Credits;
