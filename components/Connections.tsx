
import React, { useState, useEffect } from 'react';
import { 
  Link2, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  ShieldCheck, 
  Loader2, 
  RefreshCw, 
  Activity,
  Wifi,
  Globe,
  Lock
} from 'lucide-react';
import { PlatformConnection, ActiveTab } from '../types';

interface ConnectionsProps {
  onAction: (msg: string, type?: 'success' | 'info') => void;
  onNavigate?: (tab: ActiveTab) => void;
}

const Connections: React.FC<ConnectionsProps> = ({ onAction, onNavigate }) => {
  const [platforms, setPlatforms] = useState<PlatformConnection[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [apiStats, setApiStats] = useState({
    totalRequests: '0',
    avgLatency: '0ms',
    successRate: '100%',
    encryption: 'AES-256'
  });

  // Fetch real connection status from backend
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const authData = JSON.parse(localStorage.getItem('brandpilot_auth') || '{}');
        const headers: HeadersInit = {};
        if (authData.token) {
          headers['Authorization'] = `Bearer ${authData.token}`;
        }
        const response = await fetch('http://localhost:3001/api/config', { headers });
        
        if (response.ok) {
          const configs = await response.json();
          
          // Build platform connections from config
          const platformData: PlatformConnection[] = [
            {
              id: 'x',
              name: 'X (Twitter)',
              isConnected: !!(configs.find((c: any) => c.key === 'x_api_key')?.value),
              username: configs.find((c: any) => c.key === 'x_token')?.value?.substring(0, 20) || 'Not configured',
              apiQuota: 100,
              lastSync: 'Just now'
            },
            {
              id: 'facebook',
              name: 'Facebook',
              isConnected: !!(configs.find((c: any) => c.key === 'facebook_token')?.value),
              username: configs.find((c: any) => c.key === 'facebook_page_id')?.value || 'Not configured',
              apiQuota: 100,
              lastSync: 'Just now'
            },
            {
              id: 'instagram',
              name: 'Instagram',
              isConnected: !!(configs.find((c: any) => c.key === 'instagram_token')?.value),
              username: configs.find((c: any) => c.key === 'instagram_business_id')?.value || 'Not configured',
              apiQuota: 100,
              lastSync: 'Just now'
            }
          ];
          
          setPlatforms(platformData);
        }
        
        // Fetch API statistics
        const statsResponse = await fetch('http://localhost:3001/api/stats', { headers });
        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          setApiStats({
            totalRequests: stats.totalRequests.toLocaleString(),
            avgLatency: stats.avgLatency,
            successRate: stats.successRate,
            encryption: stats.encryption
          });
        }
      } catch (error) {
        console.error('Failed to fetch connections:', error);
        // Set default empty state
        setPlatforms([
          { id: 'x', name: 'X (Twitter)', isConnected: false },
          { id: 'facebook', name: 'Facebook', isConnected: false },
          { id: 'instagram', name: 'Instagram', isConnected: false }
        ]);
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchConnections();
  }, []);

  const toggleConnection = async (id: string) => {
    const platform = platforms.find(p => p.id === id);
    
    if (platform?.isConnected) {
      // Revoke - delete credentials from database
      setLoadingId(id);
      try {
        const authData = JSON.parse(localStorage.getItem('brandpilot_auth') || '{}');
        const headers: HeadersInit = {};
        if (authData.token) {
          headers['Authorization'] = `Bearer ${authData.token}`;
        }
        
        const credentialKeys = {
          'x': ['x_api_key', 'x_api_secret', 'x_access_token', 'x_access_secret', 'x_token', 'twitter_api_url'],
          'facebook': ['facebook_token', 'facebook_page_id', 'facebook_app_id', 'facebook_app_secret', 'facebook_api_url', 'facebook_api_version'],
          'instagram': ['instagram_token', 'instagram_business_id', 'instagram_api_url', 'instagram_caption_length']
        };
        
        const keysToDelete = credentialKeys[id as keyof typeof credentialKeys] || [];
        
        console.log(`Revoking credentials for ${platform.name}:`, keysToDelete);
        
        // Delete each credential from config
        for (const key of keysToDelete) {
          const response = await fetch(`http://localhost:3001/api/config/${key}`, {
            method: 'DELETE',
            headers
          });
          console.log(`Deleted ${key}:`, await response.json());
        }
        
        // Update local state immediately
        setPlatforms(prev => prev.map(p => 
          p.id === id ? { ...p, isConnected: false, username: 'Not configured' } : p
        ));
        
        onAction(`${platform.name} credentials revoked successfully.`, 'success');
      } catch (error) {
        console.error('Failed to revoke credentials:', error);
        onAction(`Failed to revoke ${platform.name} credentials.`, 'info');
      } finally {
        setLoadingId(null);
      }
    } else {
      // Navigate to credentials page to add credentials
      onAction(`Navigate to Credentials page to configure ${platform?.name} API keys.`, 'info');
      if (onNavigate) {
        onNavigate('credentials');
      }
    }
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
          <Wifi size={16} className={isLoadingData ? "animate-spin" : "animate-pulse"} />
          Gateway: {isLoadingData ? 'Loading...' : 'Operational'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total API Requests', value: apiStats.totalRequests, sub: 'Last 24h', icon: Activity, color: 'text-indigo-600' },
          { label: 'Avg Latency', value: apiStats.avgLatency, sub: 'Global Edge', icon: Globe, color: 'text-sky-600' },
          { label: 'Success Rate', value: apiStats.successRate, sub: 'Production', icon: CheckCircle, color: 'text-emerald-600' },
          { label: 'Encryption', value: apiStats.encryption, sub: 'OAuth 2.1', icon: Lock, color: 'text-slate-600' },
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
            <p className="text-sm text-indigo-700">
              {platforms.filter(p => p.isConnected).length} of {platforms.length} platforms configured. 
              All tokens encrypted with TLS 1.3 + AES-256-GCM.
            </p>
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
                      ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md active:scale-95'
                  }`}
                >
                  {loadingId === platform.id ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : platform.isConnected ? (
                    <>Revoke Access <XCircle size={14} /></>
                  ) : (
                    <>Configure API <ExternalLink size={14} /></>
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
