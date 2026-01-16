
import React from 'react';
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
  Key
} from 'lucide-react';
import { ActiveTab } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onAction: (msg: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onAction }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'dna', label: 'Brand DNA', icon: Fingerprint },
    { id: 'strategist', label: 'AI Strategist', icon: Compass },
    { id: 'engine', label: 'Content Engine', icon: PenTool },
    { id: 'calendar', label: 'Content Calendar', icon: Calendar },
    { id: 'connections', label: 'Connections', icon: Link2 },
    { id: 'credentials', label: 'API Credentials', icon: Key },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'monetization', label: 'Monetization', icon: Coins },
  ];

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
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Pro Plan</p>
          <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden mb-3">
            <div className="bg-indigo-500 h-full w-[75%] rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
          </div>
          <p className="text-sm text-slate-300 mb-3 font-medium">7,500 / 10,000 credits</p>
          <button 
            onClick={() => onAction('Upgrade flow coming soon...')}
            className="w-full py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-sm font-bold hover:bg-indigo-500/20 transition-all"
          >
            Upgrade Plan
          </button>
        </div>
        
        <button 
          onClick={() => onAction('Settings panel coming soon...')}
          className="w-full mt-4 flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all font-medium"
        >
          <Settings size={20} />
          Settings
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
