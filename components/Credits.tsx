import React, { useState, useEffect } from 'react';
import { Coins, TrendingUp, RefreshCw, Image, FileText, Calendar, Sparkles, Filter, X } from 'lucide-react';
import { canUseFeature } from '../services/planService';

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
  const [filteredTransactions, setFilteredTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCredits, setCurrentCredits] = useState(0);
  const [maxCredits, setMaxCredits] = useState(0);
  const [plan, setPlan] = useState('free');
  
  // Filter states
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all'); // 'all', 'spent', 'earned'

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
        setFilteredTransactions(historyData.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
      onAction('Failed to load credits data', 'info');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters whenever filter states or transactions change
  useEffect(() => {
    applyFilters();
  }, [actionFilter, dateFilter, typeFilter, transactions]);

  const applyFilters = () => {
    let filtered = [...transactions];

    // Filter by action type
    if (actionFilter !== 'all') {
      filtered = filtered.filter(txn => txn.action === actionFilter);
    }

    // Filter by date range
    if (dateFilter !== 'all') {
      const now = new Date();
      let filterDate = new Date();
      
      switch (dateFilter) {
        case '7days':
          filterDate.setDate(now.getDate() - 7);
          break;
        case '30days':
          filterDate.setDate(now.getDate() - 30);
          break;
        case '90days':
          filterDate.setDate(now.getDate() - 90);
          break;
        default:
          filterDate = new Date(0); // Show all
      }
      
      filtered = filtered.filter(txn => new Date(txn.createdAt) >= filterDate);
    }

    // Filter by transaction type
    if (typeFilter === 'spent') {
      filtered = filtered.filter(txn => txn.amount < 0);
    } else if (typeFilter === 'earned') {
      filtered = filtered.filter(txn => txn.amount > 0);
    }

    setFilteredTransactions(filtered);
  };

  const clearFilters = () => {
    setActionFilter('all');
    setDateFilter('all');
    setTypeFilter('all');
  };

  const getUniqueActions = () => {
    const actions = [...new Set(transactions.map(txn => txn.action))];
    return actions;
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
          {/* Only show Brand DNA cost if user's plan includes it */}
          {canUseFeature(plan, 'brandDNA') && (
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <Sparkles size={20} className="text-purple-500" />
              <div>
                <p className="font-bold text-slate-900">Brand DNA</p>
                <p className="text-sm text-slate-600">30 credits</p>
              </div>
            </div>
          )}
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
              <p className="text-sm text-slate-600">30 credits</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar size={20} className="text-indigo-600" />
              Transaction History
            </h3>
            <div className="text-sm text-slate-500">
              {filteredTransactions.length} of {transactions.length} transactions
            </div>
          </div>
          
          {/* Filters */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {/* Action Filter */}
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-slate-400" />
                <select 
                  value={actionFilter} 
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Actions</option>
                  {getUniqueActions().map((action: string) => (
                    <option key={action} value={action}>{getActionLabel(action)}</option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <select 
                value={dateFilter} 
                onChange={(e) => setDateFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Time</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
              </select>

              {/* Type Filter */}
              <select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Types</option>
                <option value="spent">Credits Spent</option>
                <option value="earned">Credits Earned</option>
              </select>

              {/* Clear Filters */}
              {(actionFilter !== 'all' || dateFilter !== 'all' || typeFilter !== 'all') && (
                <button 
                  onClick={clearFilters}
                  className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <X size={14} />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Coins className="text-slate-400" size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {transactions.length === 0 ? 'No transactions yet' : 'No transactions match your filters'}
            </h3>
            <p className="text-slate-500">
              {transactions.length === 0 
                ? 'Your credit usage history will appear here' 
                : 'Try adjusting your filters to see more results'
              }
            </p>
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
                {filteredTransactions.map((txn) => (
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
