import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Fingerprint, 
  Compass, 
  PenTool, 
  BarChart3, 
  Coins,
  Settings,
  Sparkles,
  Calendar,
  Link2,
  Key,
  Info,
  LogOut,
  Receipt,
  CreditCard,
  MessageSquareText,
  User,
  Mail,
  Users
} from 'lucide-react';
import { ActiveTab } from '../types';
import PlanModal from './PlanModal';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onAction: (msg: string, type?: 'success' | 'info') => void;
  handleLogout: () => void;
  userPlan?: { plan: string; credits: number; maxCredits: number };
  onPlanUpgrade?: (newPlan: string, credits: number, maxCredits: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onAction, handleLogout, userPlan, onPlanUpgrade }) => {
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  
  const currentPlan = userPlan?.plan || 'free';
  const credits = userPlan?.credits || 0;
  const maxCredits = userPlan?.maxCredits || 1000;
  const creditsPercentage = maxCredits > 0 ? (credits / maxCredits) * 100 : 0;
  
  // Define all navigation items with plan requirements
  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, minPlan: 'free' },
    { id: 'dna', label: 'Brand DNA', icon: Fingerprint, minPlan: 'pro' },
    { id: 'strategist', label: 'AI Strategist', icon: Compass, minPlan: 'pro' },
    { id: 'engine', label: 'Content Engine', icon: PenTool, minPlan: 'free' },
    { id: 'calendar', label: 'Content Calendar', icon: Calendar, minPlan: 'free' },
    { id: 'connections', label: 'Connections', icon: Link2, minPlan: 'free' },
    { id: 'credentials', label: 'API Credentials', icon: Key, minPlan: 'business' },
    { id: 'performance', label: 'Performance', icon: BarChart3, minPlan: 'free' },
    { id: 'platform-responses', label: 'Platform Responses', icon: MessageSquareText, minPlan: 'business' },
    { id: 'monetization', label: 'Monetization', icon: Coins, minPlan: 'pro' },
    { id: 'payment-history', label: 'Payment History', icon: Receipt, minPlan: 'free' },
    { id: 'credits', label: 'Credits & Usage', icon: CreditCard, minPlan: 'free' },
    { id: 'profile', label: 'Profile Settings', icon: User, minPlan: 'free' },
    { id: 'email-logs', label: 'Email Logs', icon: Mail, minPlan: 'business' },
    { id: 'manage-users', label: 'Manage Users', icon: Users, minPlan: 'business' },
    { id: 'documentation', label: 'Documentation', icon: Info, minPlan: 'free' },
    { id: 'adminposts', label: 'Admin Posts', icon: Settings, minPlan: 'free' },
  ];

  // Plan hierarchy for filtering
  const planHierarchy: Record<string, number> = {
    'free': 0,
    'pro': 1,
    'business': 2,
    'enterprise': 3
  };

  // Filter nav items based on user's plan
  const navItems = allNavItems.filter(item => 
    planHierarchy[currentPlan] >= planHierarchy[item.minPlan]
  );

  return (
    <div className="w-64 h-screen bg-slate-900 text-slate-300 flex flex-col fixed left-0 top-0 border-r border-slate-800 z-40">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Sparkles className="text-white w-6 h-6" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">BrandPilot</span>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as ActiveTab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">
            {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan
          </p>
          <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden mb-3">
            <div 
              className={`h-full rounded-full transition-all ${
                creditsPercentage > 50 ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' :
                creditsPercentage > 20 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
              }`}
              style={{ width: `${creditsPercentage}%` }}
            ></div>
          </div>
          <p className="text-sm text-slate-300 mb-3 font-medium">
            {credits.toLocaleString()} / {maxCredits.toLocaleString()} credits
          </p>
          <button 
            onClick={() => setIsPlanModalOpen(true)}
            className="w-full py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-sm font-bold hover:bg-indigo-500/20 transition-all"
          >
            Upgrade Plan
          </button>
        </div>
        
        <button 
          onClick={() => setActiveTab('profile')}
          className="w-full mt-4 flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all font-medium"
        >
          <Settings size={20} />
          Settings
        </button>

        <button 
          onClick={handleLogout}
          className="w-full mt-2 flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-slate-800 hover:text-rose-300 transition-all font-medium"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>

      {/* Plan Modal */}
      <PlanModal 
        isOpen={isPlanModalOpen} 
        onClose={() => setIsPlanModalOpen(false)}
        onAction={onAction}
        currentPlan={userPlan?.plan as 'free' | 'pro' | 'business' | 'enterprise' || 'free'}
        onPlanUpgrade={onPlanUpgrade}
      />
    </div>
  );
};

export default Sidebar;
