import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Shield, CreditCard, Save, X, Check, AlertCircle, Camera } from 'lucide-react';

const API_PREFIX = window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api';

interface ProfileProps {
  auth: { userId: string; username: string; role: string; token: string } | null;
  userPlan: { plan: string; credits: number; maxCredits: number };
  onAction: (msg: string) => void;
  onUpdate: (newAuth: any) => void;
}

const Profile: React.FC<ProfileProps> = ({ auth, userPlan, onAction, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState(auth?.username || '');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('default');
  const [userStats, setUserStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    totalCreditsUsed: 0,
    accountCreated: new Date()
  });

  // Avatar options
  const avatarStyles = [
    { id: 'default', name: 'Default', bg: '6366f1', color: 'fff' },
    { id: 'gradient1', name: 'Purple', bg: '8b5cf6', color: 'fff' },
    { id: 'gradient2', name: 'Blue', bg: '3b82f6', color: 'fff' },
    { id: 'gradient3', name: 'Green', bg: '10b981', color: 'fff' },
    { id: 'gradient4', name: 'Orange', bg: 'f97316', color: 'fff' },
    { id: 'gradient5', name: 'Pink', bg: 'ec4899', color: 'fff' }
  ];

  useEffect(() => {
    loadUserData();
  }, [auth?.userId]);

  const loadUserData = async () => {
    if (!auth?.userId) return;

    try {
      // Load user stats
      const response = await fetch(`${API_PREFIX}/user/stats/${auth.userId}`);
      if (response.ok) {
        const data = await response.json();
        setUserStats(data);
        if (data.email) setEmail(data.email);
        if (data.avatarStyle) {
          // Convert hex color back to avatar ID
          const matchingAvatar = avatarStyles.find(a => a.bg === data.avatarStyle);
          setSelectedAvatar(matchingAvatar ? matchingAvatar.id : 'default');
        }
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!auth?.userId) return;

    // Validation
    if (username.trim().length < 3) {
      onAction('Username must be at least 3 characters');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      onAction('Passwords do not match');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      onAction('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // Get the actual color hex from the selected avatar style
      const avatarConfig = avatarStyles.find(a => a.id === selectedAvatar) || avatarStyles[0];
      
      const updateData: any = {
        username: username.trim(),
        avatarStyle: avatarConfig.bg // Save the hex color, not the ID
      };

      if (email) updateData.email = email;
      if (newPassword) {
        updateData.currentPassword = currentPassword;
        updateData.newPassword = newPassword;
      }

      const response = await fetch(`${API_PREFIX}/user/profile/${auth.userId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      const updatedUser = await response.json();
      
      // Update auth with new username and avatarStyle
      onUpdate({
        ...auth,
        username: updatedUser.username,
        avatarStyle: avatarConfig.bg // Update with the hex color
      });

      onAction('Profile updated successfully!');
      setIsEditing(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      onAction(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getAvatarUrl = (style: string) => {
    const avatarConfig = avatarStyles.find(a => a.id === style) || avatarStyles[0];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(username || 'User')}&background=${avatarConfig.bg}&color=${avatarConfig.color}&size=200&bold=true`;
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Profile Settings</h1>
          <p className="text-slate-600">Manage your account information and preferences</p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => {
                setIsEditing(false);
                setUsername(auth?.username || '');
                setNewPassword('');
                setConfirmPassword('');
                setCurrentPassword('');
              }}
              className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-colors flex items-center gap-2"
            >
              <X size={18} /> Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
            <div className="relative inline-block mb-4">
              <img
                src={getAvatarUrl(selectedAvatar)}
                alt="Profile"
                className="w-32 h-32 rounded-2xl border-4 border-slate-200 object-cover"
              />
              {isEditing && (
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                  <Camera size={20} />
                </div>
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">{username}</h3>
            <p className="text-sm text-slate-500 capitalize mb-4">{userPlan.plan} Plan</p>
            
            {isEditing && (
              <div className="space-y-3 mt-6">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider text-left">Choose Avatar Color</p>
                <div className="grid grid-cols-3 gap-2">
                  {avatarStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedAvatar(style.id)}
                      className={`relative w-full aspect-square rounded-xl border-2 transition-all ${
                        selectedAvatar === style.id 
                          ? 'border-indigo-600 ring-2 ring-indigo-200' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      style={{ backgroundColor: `#${style.bg}` }}
                    >
                      {selectedAvatar === style.id && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check size={20} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Account Stats */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mt-6">
            <h3 className="font-bold text-slate-900 mb-4">Account Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Posts</span>
                <span className="font-bold text-slate-900">{userStats.totalPosts}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Published</span>
                <span className="font-bold text-slate-900">{userStats.publishedPosts}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Credits Used</span>
                <span className="font-bold text-slate-900">{userStats.totalCreditsUsed}</span>
              </div>
              <div className="pt-3 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                  Member since {new Date(userStats.accountCreated).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <User size={20} className="text-indigo-600" />
              Basic Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                  placeholder="Enter your username"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>
          </div>

          {/* Change Password */}
          {isEditing && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Lock size={20} className="text-indigo-600" />
                Change Password
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Confirm new password"
                  />
                </div>
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <div className="flex items-center gap-2 text-rose-600 text-sm">
                    <AlertCircle size={16} />
                    <span>Passwords do not match</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Account Information */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Shield size={20} className="text-indigo-600" />
              Account Information
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <div>
                  <p className="font-bold text-slate-900">User ID</p>
                  <p className="text-sm text-slate-500">Your unique identifier</p>
                </div>
                <code className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-mono text-slate-700">
                  {auth?.userId?.substring(0, 12)}...
                </code>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <div>
                  <p className="font-bold text-slate-900">Account Type</p>
                  <p className="text-sm text-slate-500">Your current role</p>
                </div>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-bold capitalize">
                  {auth?.role}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <div>
                  <p className="font-bold text-slate-900">Current Plan</p>
                  <p className="text-sm text-slate-500">Credits: {userPlan.credits} / {userPlan.maxCredits}</p>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold capitalize">
                  {userPlan.plan}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
