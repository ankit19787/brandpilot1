import React, { useEffect, useState } from 'react';
import { Search, Filter, Calendar, User, Hash } from 'lucide-react';

const AdminPosts = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('user'); // Track user role
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);
        
        // Get auth token and user info from localStorage
        const authData = JSON.parse(localStorage.getItem('brandpilot_auth') || '{}');
        const headers: HeadersInit = {};
        
        if (authData.token) {
          headers['Authorization'] = `Bearer ${authData.token}`;
        }
        
        // Set user role for UI display
        setUserRole(authData.user?.role || 'user');
        
        // Use different endpoints based on user role
        const isAdmin = authData.user?.role === 'admin';
        const endpoint = isAdmin ? '/api/posts/all' : '/api/posts';
        
        const response = await fetch(endpoint, { headers });
        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }
        const data = await response.json();
        setPosts(data);
        setFilteredPosts(data);
      } catch (err: any) {
        console.error('Error fetching posts:', err);
        setError(err.message || 'Failed to load posts');
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  // Apply filters whenever filter states change
  useEffect(() => {
    let filtered = [...posts];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(post => 
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.user?.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Platform filter
    if (platformFilter !== 'all') {
      filtered = filtered.filter(post => post.platform === platformFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(post => post.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(post => new Date(post.createdAt) >= filterDate);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(post => new Date(post.createdAt) >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(post => new Date(post.createdAt) >= filterDate);
          break;
      }
    }

    setFilteredPosts(filtered);
  }, [searchTerm, platformFilter, statusFilter, dateFilter, posts]);

  const resetFilters = () => {
    setSearchTerm('');
    setPlatformFilter('all');
    setStatusFilter('all');
    setDateFilter('all');
  };

  if (loading) {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-4">{userRole === 'admin' ? 'All Social Posts' : 'My Posts'}</h2>
        <p>Loading posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-4">{userRole === 'admin' ? 'All Social Posts' : 'My Posts'}</h2>
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {userRole === 'admin' ? 'All Social Posts' : 'My Posts'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {userRole === 'admin' 
              ? 'View and manage posts from all users'
              : 'View and manage your social media posts'
            }
          </p>
        </div>
        <div className="text-sm text-slate-500">
          Showing {filteredPosts.length} of {posts.length} posts
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-700 font-semibold mb-4">
          <Filter size={18} />
          <span>Filters</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">
              <Search size={14} className="inline mr-1" />
              Search Content/User
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Platform Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">
              <Hash size={14} className="inline mr-1" />
              Platform
            </label>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Platforms</option>
              <option value="Instagram">Instagram</option>
              <option value="Facebook">Facebook</option>
              {userRole === 'admin' && (
                <option value="X (Twitter)">X (Twitter)</option>
              )}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">
              <Filter size={14} className="inline mr-1" />
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
              <option value="draft">Draft</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">
              <Calendar size={14} className="inline mr-1" />
              Date Range
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={resetFilters}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Posts Table */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <p className="text-slate-500">No posts found matching your filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {userRole === 'admin' && (
                    <th className="py-3 px-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
                  )}
                  <th className="py-3 px-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Platform</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Content</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Image</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Scheduled</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPosts.map(post => (
                  <tr key={post.id} className="hover:bg-slate-50 transition-colors">
                    {userRole === 'admin' && (
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <User size={16} className="text-indigo-600" />
                          </div>
                          <span className="font-medium text-slate-900">{post.user?.username || 'Unknown'}</span>
                        </div>
                      </td>
                    )}
                    <td className="py-3 px-4 text-sm">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        post.platform === 'Instagram' ? 'bg-pink-100 text-pink-700' :
                        post.platform === 'Facebook' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {post.platform}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 max-w-md">
                      <div className="truncate">{post.content}</div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {post.imageUrl ? (
                        <a href={post.imageUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                          View
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        post.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                        post.status === 'scheduled' ? 'bg-amber-100 text-amber-700' :
                        post.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {post.scheduledFor ? (
                        <div className="text-sm">
                          <div className="font-medium text-slate-900">
                            {new Date(post.scheduledFor).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric'
                            })}
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(post.scheduledFor).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">Not scheduled</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {new Date(post.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPosts;
