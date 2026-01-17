import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, XCircle, RefreshCw, Filter, Calendar, TrendingUp, AlertCircle } from 'lucide-react';

interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  type: string;
  status: 'sent' | 'failed';
  messageId?: string;
  error?: string;
  metadata?: string;
  createdAt: string;
}

interface EmailStats {
  totalSent: number;
  totalFailed: number;
  total: number;
  successRate: string;
}

const EmailLogs: React.FC = () => {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<EmailStats>({
    totalSent: 0,
    totalFailed: 0,
    total: 0,
    successRate: '0'
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');

  const fetchEmailLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterType) params.append('type', filterType);
      
      const response = await fetch(`/api/email-logs?${params.toString()}`);
      const data = await response.json();
      
      setLogs(data.logs);
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch email logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmailLogs();
  }, [filterStatus, filterType]);

  const getEmailTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      post_published: 'Post Published',
      post_failed: 'Post Failed',
      payment_confirmed: 'Payment Confirmed',
      payment_failed: 'Payment Failed',
      plan_upgraded: 'Plan Upgraded',
      credits_low: 'Credits Low',
      brand_dna_generated: 'Brand DNA Generated',
      other: 'Other'
    };
    return labels[type] || type;
  };

  const getEmailTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      post_published: 'bg-green-100 text-green-700',
      post_failed: 'bg-red-100 text-red-700',
      payment_confirmed: 'bg-blue-100 text-blue-700',
      payment_failed: 'bg-orange-100 text-orange-700',
      plan_upgraded: 'bg-purple-100 text-purple-700',
      credits_low: 'bg-yellow-100 text-yellow-700',
      brand_dna_generated: 'bg-indigo-100 text-indigo-700',
      other: 'bg-gray-100 text-gray-700'
    };
    return colors[type] || colors.other;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">
            <Mail size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Email Logs</h1>
            <p className="text-slate-500">Monitor email delivery status and performance</p>
          </div>
        </div>
        <button
          onClick={fetchEmailLogs}
          disabled={loading}
          className="px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm font-medium">Total Sent</span>
            <CheckCircle size={20} className="text-green-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{stats.totalSent}</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm font-medium">Total Failed</span>
            <XCircle size={20} className="text-red-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{stats.totalFailed}</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm font-medium">Success Rate</span>
            <TrendingUp size={20} className="text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{stats.successRate}%</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm font-medium">Total Emails</span>
            <Mail size={20} className="text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex gap-4 items-center">
        <Filter size={20} className="text-slate-400" />
        <div className="flex gap-3 flex-1">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="post_published">Post Published</option>
            <option value="post_failed">Post Failed</option>
            <option value="payment_confirmed">Payment Confirmed</option>
            <option value="payment_failed">Payment Failed</option>
            <option value="plan_upgraded">Plan Upgraded</option>
            <option value="credits_low">Credits Low</option>
            <option value="brand_dna_generated">Brand DNA Generated</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Recipient
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <RefreshCw className="animate-spin mx-auto mb-2 text-slate-400" size={24} />
                    <p className="text-slate-500">Loading email logs...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Mail className="mx-auto mb-2 text-slate-400" size={32} />
                    <p className="text-slate-500">No email logs found</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.status === 'sent' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                          <CheckCircle size={14} />
                          Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium">
                          <XCircle size={14} />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEmailTypeBadgeColor(log.type)}`}>
                        {getEmailTypeLabel(log.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">{log.recipient}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900 max-w-xs truncate">{log.subject}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {log.error ? (
                        <div className="flex items-center gap-2">
                          <AlertCircle size={16} className="text-red-500" />
                          <span className="text-xs text-red-600 max-w-xs truncate" title={log.error}>
                            {log.error}
                          </span>
                        </div>
                      ) : log.messageId ? (
                        <span className="text-xs text-slate-500 font-mono truncate max-w-xs" title={log.messageId}>
                          {log.messageId}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmailLogs;
