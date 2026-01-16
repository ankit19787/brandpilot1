
import React, { useState } from 'react';
import { 
  Link2, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  ShieldCheck, 
  Loader2, 
  RefreshCw, 
  Activity, 
  Lock,
  Globe,
  Wifi
} from 'lucide-react';
import { PlatformConnection } from '../types';

interface ConnectionsProps {
  onAction: (msg: string, type?: 'success' | 'info') => void;
}

const Connections: React.FC<ConnectionsProps> = ({ onAction }) => {
  const [platforms, setPlatforms] = useState<PlatformConnection[]>([
    { id: 'linkedin', name: 'LinkedIn', isConnected: true, username: 'Alex Rivera (TutoringTik)', apiQuota: 92, lastSync: '10 mins ago' },
    { id: 'x', name: 'X (Twitter)', isConnected: true, username: '@tutoring_tik', apiQuota: 45, lastSync: '1 hour ago' },
    { id: 'facebook', name: 'Facebook', isConnected: true, username: 'TutoringTik Global Page', apiQuota: 88, lastSync: '5 mins ago' },
    { id: 'instagram', name: 'Instagram', isConnected: true, username: 'tutoring_tik_official', apiQuota: 88, lastSync: 'Just now' },
    { id: 'youtube', name: 'YouTube', isConnected: true, username: 'TutoringTik Lab', apiQuota: 100, lastSync: '2 hours ago' },
    { id: 'whatsapp', name: 'WhatsApp', isConnected: true, username: 'TutoringTik Biz', apiQuota: 100, lastSync: 'Just now' },
  ]);

  const [loadingId, setLoadingId] = useState<string | null>(null);

  const toggleConnection = (id: string) => {
    setLoadingId(id);
    setTimeout(() => {
      setPlatforms(prev => prev.map(p => {
        if (p.id === id) {
          const newState = !p.isConnected;
          onAction(newState ? `API Connection established with ${p.name}` : `Token revoked for ${p.name}.`, newState ? 'success' : 'info');
          return { 
            ...p, 
            isConnected: newState, 
            username: newState ? 'Alex Rivera (TutoringTik)' : undefined,
            apiQuota: newState ? 100 : undefined,
            lastSync: newState ? 'Just now' : undefined
          };
        }
        return p;
      }));
      setLoadingId(null);
    }, 1500);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
            <Link2 size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Platform APIs</h1>
            <p className="text-slate-500">Manage OAuth credentials and production API gateways.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 font-bold text-sm">
          <Wifi size={16} className="animate-pulse" />
          Gateway: Operational
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total API Requests', value: '5,821', sub: 'Last 24h', icon: Activity, color: 'text-indigo-600' },
          { label: 'Avg Latency', value: '138ms', sub: 'Global Edge', icon: Globe, color: 'text-sky-600' },
          { label: 'Success Rate', value: '99.9%', sub: 'Production', icon: CheckCircle, color: 'text-emerald-600' },
          { label: 'Encryption', value: 'AES-256', sub: 'OAuth 2.1', icon: Lock, color: 'text-slate-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={stat.color} size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.sub}</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-tight">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-8 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
          <ShieldCheck className="text-indigo-600" size={24} />
          <div>
            <p className="font-bold text-indigo-900">Production Key Management</p>
            <p className="text-sm text-indigo-700">All access tokens are hardware-encrypted in transit and rest.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {platforms.map((platform) => (
            <div key={platform.id} className="p-6 rounded-3xl border border-slate-100 bg-slate-50/50 flex flex-col group hover:border-indigo-200 hover:bg-white transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl ${
                    platform.isConnected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white border border-slate-200 text-slate-400'
                  }`}>
                    {platform.name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{platform.name}</h3>
                    {platform.isConnected ? (
                      <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                        <CheckCircle size={10} />
                        Live Endpoint
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                        <XCircle size={10} />
                        Revoked
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => toggleConnection(platform.id)}
                  disabled={!!loadingId}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                    platform.isConnected 
                      ? 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md active:scale-95'
                  }`}
                >
                  {loadingId === platform.id ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : platform.isConnected ? (
                    'Revoke API'
                  ) : (
                    <>Establish Connection <ExternalLink size={14} /></>
                  )}
                </button>
              </div>

              {platform.isConnected && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Token: {platform.username?.substring(0, 10)}...</span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Quota: <span className="text-indigo-600">{platform.apiQuota}% Remaining</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Connections;
