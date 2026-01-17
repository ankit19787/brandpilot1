import React, { useState, useEffect } from 'react';
import { Users, Shield, Mail, CreditCard, Calendar, Edit2, Save, X, Search, Filter, UserPlus, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string | null;
  role: string;
  plan: string;
  credits: number;
  maxCredits: number;
  avatarStyle: string;
  createdAt: string;
  _count?: {
    posts: number;
  };
}

const ManageUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: '',
    password: '',
    email: '',
    role: 'user',
    plan: 'free',
    credits: 1000,
    maxCredits: 1000
  });

  const roles = ['admin', 'user'];
  const plans = ['free', 'pro', 'business', 'enterprise'];
  
  // Plan credit limits
  const planLimits: Record<string, number> = {
    free: 1000,
    pro: 10000,
    business: 50000,
    enterprise: 100000
  };

  useEffect(() => {
    fetchUsers();
  }, []);
  
  // Update credits when plan changes in create form
  useEffect(() => {
    const newLimit = planLimits[createForm.plan];
    setCreateForm(prev => ({
      ...prev,
      credits: newLimit,
      maxCredits: newLimit
    }));
  }, [createForm.plan]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user.id);
    setEditForm({
      username: user.username,
      email: user.email,
      role: user.role,
      plan: user.plan,
      credits: user.credits,
      maxCredits: user.maxCredits,
      originalPlan: user.plan // Store original plan
    });
  };
  
  const handlePlanChange = (newPlan: string) => {
    const newLimit = planLimits[newPlan];
    setEditForm(prev => ({
      ...prev,
      plan: newPlan,
      maxCredits: newLimit,
      // If upgrading, give full credits; if downgrading, cap at new limit
      credits: planLimits[newPlan] > planLimits[prev.plan || 'free'] 
        ? newLimit 
        : Math.min(prev.credits || 0, newLimit)
    }));
  };

  const handleSave = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        await fetchUsers();
        setEditingUser(null);
        setEditForm({});
      } else {
        const error = await response.json();
        alert(`Failed to update user: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to save user:', error);
      alert('Failed to save user');
    }
  };

  const handleDelete = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchUsers();
      } else {
        const error = await response.json();
        alert(`Failed to delete user: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    }
  };

  const handleCreateUser = async () => {
    if (!createForm.username || !createForm.password) {
      alert('Username and password are required');
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      });

      if (response.ok) {
        await fetchUsers();
        setShowCreateForm(false);
        setCreateForm({
          username: '',
          password: '',
          email: '',
          role: 'user',
          plan: 'free',
          credits: 1000,
          maxCredits: 1000
        });
        alert('User created successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to create user: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('Failed to create user');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = !filterRole || user.role === filterRole;
    const matchesPlan = !filterPlan || user.plan === filterPlan;
    return matchesSearch && matchesRole && matchesPlan;
  });

  const getRoleBadgeColor = (role: string) => {
    return role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700';
  };

  const getPlanBadgeColor = (plan: string) => {
    const colors: Record<string, string> = {
      free: 'bg-slate-100 text-slate-700',
      pro: 'bg-blue-100 text-blue-700',
      business: 'bg-purple-100 text-purple-700',
      enterprise: 'bg-amber-100 text-amber-700'
    };
    return colors[plan] || colors.free;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
            <Users size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Manage Users</h1>
            <p className="text-slate-500">View and manage user accounts, roles, and permissions</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20"
        >
          <UserPlus size={20} />
          {showCreateForm ? 'Cancel' : 'Create User'}
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm font-medium">Total Users</span>
            <Users size={20} className="text-indigo-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{users.length}</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm font-medium">Admins</span>
            <Shield size={20} className="text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {users.filter(u => u.role === 'admin').length}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm font-medium">With Email</span>
            <Mail size={20} className="text-green-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {users.filter(u => u.email).length}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm font-medium">Paid Plans</span>
            <CreditCard size={20} className="text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {users.filter(u => u.plan !== 'free').length}
          </div>
        </div>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <div className="bg-white rounded-2xl p-6 border border-indigo-200 shadow-lg">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <UserPlus size={24} className="text-indigo-600" />
            Create New User
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Plan</label>
              <select
                value={createForm.plan}
                onChange={(e) => setCreateForm({ ...createForm, plan: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {plans.map(plan => (
                  <option key={plan} value={plan}>{plan}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Credits <span className="text-xs text-slate-500">(based on {createForm.plan} plan)</span>
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  value={createForm.credits}
                  readOnly
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-600"
                  title="Credits are automatically set based on the selected plan"
                />
                <span className="text-slate-400">/</span>
                <input
                  type="number"
                  value={createForm.maxCredits}
                  readOnly
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-600"
                  title="Max credits are determined by the selected plan"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleCreateUser}
              className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <CheckCircle size={18} />
              Create User
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setCreateForm({
                  username: '',
                  password: '',
                  email: '',
                  role: 'user',
                  plan: 'free',
                  credits: 1000,
                  maxCredits: 1000
                });
              }}
              className="px-6 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2"
            >
              <X size={18} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search size={20} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>

          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Plans</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="business">Business</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Credits
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                      <span className="text-slate-500">Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Users className="mx-auto mb-2 text-slate-400" size={32} />
                    <p className="text-slate-500">No users found</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    {editingUser === user.id ? (
                      <>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editForm.username}
                            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                            className="px-3 py-1 border border-slate-300 rounded-lg w-full"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="email"
                            value={editForm.email || ''}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            className="px-3 py-1 border border-slate-300 rounded-lg w-full"
                            placeholder="user@example.com"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={editForm.role}
                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                            className="px-3 py-1 border border-slate-300 rounded-lg"
                          >
                            {roles.map(role => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={editForm.plan}
                            onChange={(e) => handlePlanChange(e.target.value)}
                            className="px-3 py-1 border border-slate-300 rounded-lg"
                          >
                            {plans.map(plan => (
                              <option key={plan} value={plan}>{plan}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1">
                            <input
                              type="number"
                              value={editForm.credits}
                              onChange={(e) => setEditForm({ ...editForm, credits: Math.min(parseInt(e.target.value) || 0, editForm.maxCredits || 0) })}
                              className="px-2 py-1 border border-slate-300 rounded-lg w-20"
                              max={editForm.maxCredits}
                            />
                            <span className="text-slate-400">/</span>
                            <input
                              type="number"
                              value={editForm.maxCredits}
                              readOnly
                              className="px-2 py-1 border border-slate-200 rounded-lg w-20 bg-slate-50 text-slate-600"
                              title="Max credits are determined by the plan"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSave(user.id)}
                              className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                              title="Save"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={() => setEditingUser(null)}
                              className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                              style={{ backgroundColor: `#${user.avatarStyle}` }}
                            >
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">{user.username}</div>
                              {user._count && (
                                <div className="text-xs text-slate-500">{user._count.posts} posts</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {user.email ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle size={14} className="text-green-500" />
                              <span className="text-sm text-slate-700">{user.email}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <XCircle size={14} className="text-slate-400" />
                              <span className="text-sm text-slate-400">No email</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPlanBadgeColor(user.plan)}`}>
                            {user.plan}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-slate-900">
                              {user.credits.toLocaleString()} / {user.maxCredits.toLocaleString()}
                            </div>
                            <div className="text-xs text-slate-500">
                              {Math.round((user.credits / user.maxCredits) * 100)}%
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(user)}
                              className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(user.id, user.username)}
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
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

export default ManageUsers;
