import React, { useState, useEffect } from 'react';
import { 
  MessageSquareText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ExternalLink, 
  RefreshCw, 
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';

interface PlatformResponse {
  id: string;
  platform: string;
  content: string;
  status: string;
  createdAt: string;
  publishedAt?: string;
  scheduledFor?: string;
  platformPostId?: string;
  platformResponse?: string;
  platformError?: string;
  publishAttempts: number;
  lastPublishAttempt?: string;
  user: {
    username: string;
  };
}

interface PlatformResponsesProps {
  onAction: (msg: string, type?: 'success' | 'info') => void;
  auth?: { userId: string };
}

const PlatformResponses: React.FC<PlatformResponsesProps> = ({ onAction, auth }) => {
  const [responses, setResponses] = useState<PlatformResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [showResponseDetails, setShowResponseDetails] = useState<{ [key: string]: boolean }>({});

  const fetchResponses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/posts/all');
      if (!response.ok) throw new Error('Failed to fetch posts');
      
      const posts = await response.json();
      setResponses(posts);
    } catch (error: any) {
      onAction(`Failed to fetch platform responses: ${error.message}`, 'info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, []);

  const toggleResponseDetails = (postId: string) => {
    setShowResponseDetails(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle2 className="text-green-500" size={20} />;
      case 'failed':
        return <XCircle className="text-red-500" size={20} />;
      case 'scheduled':
      case 'publishing':
        return <Clock className="text-yellow-500" size={20} />;
      default:
        return <Clock className="text-gray-500" size={20} />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 text-xs font-semibold rounded-full";
    switch (status) {
      case 'published':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'scheduled':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'publishing':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const parseResponse = (responseString: string) => {
    try {
      return JSON.parse(responseString);
    } catch {
      return responseString;
    }
  };

  const filteredResponses = responses.filter(response => {
    const statusMatch = selectedStatus === 'all' || response.status === selectedStatus;
    const platformMatch = selectedPlatform === 'all' || response.platform === selectedPlatform;
    return statusMatch && platformMatch;
  });

  const platforms = [...new Set(responses.map(r => r.platform))];
  const statuses = [...new Set(responses.map(r => r.status))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="animate-spin text-indigo-600" size={32} />
          <span className="ml-3 text-lg text-slate-600">Loading platform responses...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <MessageSquareText className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Platform Responses</h1>
              <p className="text-slate-600">Track success and failure responses from social media platforms</p>
            </div>
          </div>
          <button 
            onClick={fetchResponses}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-lg shadow-indigo-500/20"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Filter className="text-slate-500" size={20} />
            <span className="font-semibold text-slate-700">Filters</span>
          </div>
          <div className="flex gap-4">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
              ))}
            </select>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Platforms</option>
              {platforms.map(platform => (
                <option key={platform} value={platform}>{platform}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-green-500" size={24} />
              <div>
                <p className="text-sm text-slate-600">Published</p>
                <p className="text-2xl font-bold text-slate-800">{responses.filter(r => r.status === 'published').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <XCircle className="text-red-500" size={24} />
              <div>
                <p className="text-sm text-slate-600">Failed</p>
                <p className="text-2xl font-bold text-slate-800">{responses.filter(r => r.status === 'failed').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <Clock className="text-yellow-500" size={24} />
              <div>
                <p className="text-sm text-slate-600">Scheduled</p>
                <p className="text-2xl font-bold text-slate-800">{responses.filter(r => r.status === 'scheduled').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <MessageSquareText className="text-indigo-500" size={24} />
              <div>
                <p className="text-sm text-slate-600">Total</p>
                <p className="text-2xl font-bold text-slate-800">{responses.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Responses List */}
        <div className="space-y-4">
          {filteredResponses.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center">
              <MessageSquareText className="mx-auto text-slate-400 mb-4" size={48} />
              <p className="text-slate-600 text-lg">No platform responses found</p>
              <p className="text-slate-500">Create some scheduled posts to see platform responses here</p>
            </div>
          ) : (
            filteredResponses.map((response) => (
              <div key={response.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(response.status)}
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-slate-800">{response.platform}</span>
                        <span className={getStatusBadge(response.status)}>{response.status}</span>
                        {response.platformPostId && (
                          <span className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-md">
                            ID: {response.platformPostId}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">by {response.user.username} • {formatDate(response.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-slate-500">
                    {response.publishAttempts > 0 && (
                      <p>Attempts: {response.publishAttempts}</p>
                    )}
                    {response.lastPublishAttempt && (
                      <p>Last: {formatDate(response.lastPublishAttempt)}</p>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-lg">
                    {response.content.length > 200 
                      ? `${response.content.substring(0, 200)}...` 
                      : response.content
                    }
                  </p>
                </div>

                {response.scheduledFor && (
                  <p className="text-sm text-slate-600 mb-2">
                    Scheduled: {formatDate(response.scheduledFor)}
                  </p>
                )}

                {response.publishedAt && (
                  <p className="text-sm text-green-600 mb-2">
                    Published: {formatDate(response.publishedAt)}
                  </p>
                )}

                {response.platformError && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg mb-4">
                    <p className="text-red-800 font-medium">Error:</p>
                    <p className="text-red-700 text-sm">{response.platformError}</p>
                  </div>
                )}

                {response.platformResponse && (
                  <div className="border-t border-slate-200 pt-4">
                    <button
                      onClick={() => toggleResponseDetails(response.id)}
                      className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      {showResponseDetails[response.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                      {showResponseDetails[response.id] ? 'Hide' : 'Show'} Platform Response
                    </button>
                    
                    {showResponseDetails[response.id] && (
                      <div className="mt-3 bg-slate-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                        <pre>{JSON.stringify(parseResponse(response.platformResponse), null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PlatformResponses;