import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, XCircle, Clock, ChevronDown, Filter, ChevronUp } from 'lucide-react';

interface PaymentTransaction {
  id: string;
  checkoutId: string;
  paymentId: string | null;
  plan: string;
  billingCycle: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string | null;
  resultCode: string | null;
  resultDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PaymentHistoryProps {
  onAction: (msg: string, type?: 'success' | 'info') => void;
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ onAction }) => {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    fetchPaymentHistory();
  }, []);
  
  // Apply filters whenever transactions or filter values change
  useEffect(() => {
    applyFilters();
  }, [transactions, statusFilter, planFilter, dateFilter]);
  
  const applyFilters = () => {
    let filtered = [...transactions];
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(txn => txn.status === statusFilter);
    }
    
    // Plan filter
    if (planFilter !== 'all') {
      filtered = filtered.filter(txn => txn.plan === planFilter);
    }
    
    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(txn => {
        const txnDate = new Date(txn.createdAt);
        switch (dateFilter) {
          case 'today':
            return txnDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return txnDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return txnDate >= monthAgo;
          case 'year':
            const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            return txnDate >= yearAgo;
          default:
            return true;
        }
      });
    }
    
    setFilteredTransactions(filtered);
  };
  
  const resetFilters = () => {
    setStatusFilter('all');
    setPlanFilter('all');
    setDateFilter('all');
  };

  const fetchPaymentHistory = async () => {
    try {
      const authData = JSON.parse(localStorage.getItem('brandpilot_auth') || '{}');
      const response = await fetch('http://localhost:3001/api/payment/history', {
        headers: { 'Authorization': `Bearer ${authData.token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      } else {
        onAction('Failed to load payment history', 'info');
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
      onAction('Error loading payment history', 'info');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="text-emerald-500" size={20} />;
      case 'failed':
        return <XCircle className="text-red-500" size={20} />;
      case 'pending':
        return <Clock className="text-amber-500" size={20} />;
      default:
        return <Clock className="text-slate-400" size={20} />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      success: 'bg-emerald-100 text-emerald-700',
      failed: 'bg-red-100 text-red-700',
      pending: 'bg-amber-100 text-amber-700',
      cancelled: 'bg-slate-100 text-slate-700',
    };
    return styles[status as keyof typeof styles] || 'bg-slate-100 text-slate-700';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
            <CreditCard size={28} />
          </div>
          Payment History
        </h2>
        
        {(statusFilter !== 'all' || planFilter !== 'all' || dateFilter !== 'all') && (
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            Reset Filters
          </button>
        )}
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-slate-600" />
          <h3 className="font-bold text-slate-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          {/* Plan Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Plan</label>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              <option value="all">All Plans</option>
              <option value="pro">Pro</option>
              <option value="business">Business</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          
          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Date Range</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last Year</option>
            </select>
          </div>
        </div>
        
        {/* Results count */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            Showing <span className="font-bold text-slate-900">{filteredTransactions.length}</span> of <span className="font-bold">{transactions.length}</span> transactions
          </p>
        </div>
      </div>
      
      {filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="text-slate-400" size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No transactions found</h3>
          <p className="text-slate-500">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Plan</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Method</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTransactions.map((txn) => (
                  <React.Fragment key={txn.id}>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-900">
                        {formatDate(txn.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 uppercase">
                          {txn.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">
                        {txn.currency} {txn.amount.toFixed(2)}
                        <span className="ml-2 text-xs text-slate-500">/{txn.billingCycle}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {txn.paymentMethod || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(txn.status)}`}>
                          {getStatusIcon(txn.status)}
                          {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setExpanded(expanded === txn.id ? null : txn.id)}
                          className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center gap-1"
                        >
                          {expanded === txn.id ? (
                            <>
                              Hide <ChevronUp size={16} />
                            </>
                          ) : (
                            <>
                              Show <ChevronDown size={16} />
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                    
                    {expanded === txn.id && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-slate-50">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-bold text-slate-700">Transaction ID:</span>
                              <p className="text-slate-600 font-mono text-xs mt-1">{txn.id}</p>
                            </div>
                            <div>
                              <span className="font-bold text-slate-700">Checkout ID:</span>
                              <p className="text-slate-600 font-mono text-xs mt-1">{txn.checkoutId}</p>
                            </div>
                            {txn.paymentId && (
                              <div>
                                <span className="font-bold text-slate-700">Payment ID:</span>
                                <p className="text-slate-600 font-mono text-xs mt-1">{txn.paymentId}</p>
                              </div>
                            )}
                            {txn.resultCode && (
                              <div>
                                <span className="font-bold text-slate-700">Result Code:</span>
                                <p className="text-slate-600 mt-1">{txn.resultCode}</p>
                              </div>
                            )}
                            {txn.resultDescription && (
                              <div className="col-span-2">
                                <span className="font-bold text-slate-700">Description:</span>
                                <p className="text-slate-600 mt-1">{txn.resultDescription}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
