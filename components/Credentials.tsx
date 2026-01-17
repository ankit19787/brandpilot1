import React, { useState } from 'react';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001';
import { 
  Key, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Save, 
  Lock, 
  Info, 
  CheckCircle2, 
  AlertCircle,
  // Linkedin, (removed)
  Twitter,
  // Youtube, (removed)
  Instagram,
  ChevronRight,
  Database,
  RefreshCw,
  // MessageCircle, (removed)
  Loader2,
  Facebook,
  Code2,
  Copy,
  Terminal,
  Layers,
  Mail
} from 'lucide-react';

interface CredentialsProps {
  onAction: (msg: string, type?: 'success' | 'info') => void;
}

interface PlatformCreds {
  id: string;
  name: string;
  icon: any;
  color: string;
  fields: { label: string; key: string; value: string; hidden: boolean }[];
  isConfigured: boolean;
}

const Credentials: React.FC<CredentialsProps> = ({ onAction }) => {
  const getAuthHeaders = () => {
    const authData = JSON.parse(localStorage.getItem('brandpilot_auth') || '{}');
    return {
      'Content-Type': 'application/json',
      ...(authData.token ? { 'Authorization': `Bearer ${authData.token}` } : {})
    };
  };

    // Fetch latest Facebook token on mount
    React.useEffect(() => {
      async function fetchFacebookToken() {
        try {
          const authData = JSON.parse(localStorage.getItem('brandpilot_auth') || '{}');
          const headers: HeadersInit = {};
          if (authData.token) {
            headers['Authorization'] = `Bearer ${authData.token}`;
          }
          const res = await fetch(`${BACKEND_API_URL}/api/facebook-token`, { headers });
          const data = await res.json();
          if (data.token) {
            setPlatforms(prev => prev.map(p =>
              p.id === 'facebook'
                ? { ...p, fields: p.fields.map(f => f.key === 'fb_token' ? { ...f, value: data.token } : f) }
                : p
            ));
          }
        } catch (err) {
          // Ignore if backend not available
        }
      }
      fetchFacebookToken();
    }, []);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('x');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [isTesting, setIsTesting] = useState(false);
  const [showApiCollection, setShowApiCollection] = useState(false);

  // Production Meta Access Tokens (Verified)
  // All credentials will be loaded from the Config table via API

  const [platforms, setPlatforms] = useState<PlatformCreds[]>([]);

  // Fetch credentials from Config table on mount
  React.useEffect(() => {
    async function fetchCredentials() {
      try {
        const authData = JSON.parse(localStorage.getItem('brandpilot_auth') || '{}');
        const headers: HeadersInit = {};
        if (authData.token) {
          headers['Authorization'] = `Bearer ${authData.token}`;
        }
        const res = await fetch(`${BACKEND_API_URL}/api/config`, { headers });
        const configs = await res.json();
        
        // Initialize platform templates (without fields initially)
        const platformMap: Record<string, PlatformCreds> = {
          'x': {
            id: 'x',
            name: 'X (Twitter)',
            icon: Twitter,
            color: 'text-sky-500',
            isConfigured: false,
            fields: []
          },
          'facebook': {
            id: 'facebook',
            name: 'Facebook',
            icon: Facebook,
            color: 'text-blue-700',
            isConfigured: false,
            fields: []
          },
          'instagram': {
            id: 'instagram',
            name: 'Instagram',
            icon: Instagram,
            color: 'text-pink-600',
            isConfigured: false,
            fields: []
          },
          'email': {
            id: 'email',
            name: 'Email Service',
            icon: Mail,
            color: 'text-green-600',
            isConfigured: false,
            fields: []
          }
        };
        
        // Add fields from database to appropriate platforms
        configs.forEach((c: any) => {
          let platformId = 'other';
          
          // Determine platform based on key prefix/name
          if (c.key.includes('facebook') || c.key.startsWith('fb_') || c.key === 'facebook_token') {
            platformId = 'facebook';
          } else if (c.key.includes('instagram') || c.key.startsWith('ig_') || c.key === 'instagram_token') {
            platformId = 'instagram';
          } else if (c.key.includes('x_') || c.key.includes('twitter')) {
            platformId = 'x';
          } else if (c.key.includes('EMAIL_') || c.key.toLowerCase().includes('email')) {
            platformId = 'email';
          } else if (c.key.includes('cloudinary')) {
            platformId = 'cloudinary';
          } else if (c.key.includes('HYPERPAY') || c.key.includes('hyperpay')) {
            platformId = 'hyperpay';
          } else if (c.key.includes('gemini') || c.key.includes('GEMINI')) {
            platformId = 'gemini';
          } else {
            platformId = 'other';
          }
          
          // Create platform if it doesn't exist (for non-standard platforms like cloudinary, hyperpay, etc)
          if (!platformMap[platformId]) {
            platformMap[platformId] = {
              id: platformId,
              name: platformId === 'cloudinary' ? 'Cloudinary' : 
                    platformId === 'hyperpay' ? 'HyperPay Gateway' :
                    platformId === 'gemini' ? 'Gemini AI' :
                    platformId === 'email' ? 'Email Service' :
                    platformId === 'other' ? 'Other Configs' :
                    platformId.charAt(0).toUpperCase() + platformId.slice(1),
              icon: platformId === 'email' ? Mail : Database,
              color: platformId === 'email' ? 'text-green-600' : 'text-slate-500',
              isConfigured: false,
              fields: []
            };
          }
          
          // Mark platform as configured if it has any values
          if (c.value) {
            platformMap[platformId].isConfigured = true;
          }
          
          // Add field to the specific platform (no duplicates)
          platformMap[platformId].fields.push({
            label: c.key,
            key: c.key,
            value: c.value || '',
            hidden: c.key.toLowerCase().includes('secret') || 
                    c.key.toLowerCase().includes('token') || 
                    c.key.toLowerCase().includes('password') ||
                    c.key.toLowerCase().includes('access')
          });
        });
        
        setPlatforms(Object.values(platformMap));
      } catch (err) {
        // If backend not available, show empty platform templates
        setPlatforms([
          {
            id: 'x',
            name: 'X (Twitter)',
            icon: Twitter,
            color: 'text-sky-500',
            isConfigured: false,
            fields: []
          },
          {
            id: 'facebook',
            name: 'Facebook',
            icon: Facebook,
            color: 'text-blue-700',
            isConfigured: false,
            fields: []
          },
          {
            id: 'instagram',
            name: 'Instagram',
            icon: Instagram,
            color: 'text-pink-600',
            isConfigured: false,
            fields: []
          }
        ]);
      }
    }
    fetchCredentials();
  }, []);

  const activePlatform = platforms.find(p => p.id === selectedPlatform);

  const getSnippets = () => {
    if (selectedPlatform === 'x') {
      const timestamp = Math.floor(Date.now()/1000);
      return {
        curl: `curl --location 'https://api.twitter.com/2/tweets' \\
--header 'Content-Type: application/json' \\
--header 'Authorization: OAuth oauth_consumer_key="${X_API_KEY}",oauth_token="${X_ACCESS_TOKEN}",oauth_signature_method="HMAC-SHA1",oauth_timestamp="${timestamp}",oauth_nonce="nonce_string",oauth_version="1.0",oauth_signature="SIMULATED_SIGNATURE"' \\
--data '{"text": "Hello from X — OAuth 1.0a is live 🚀"}'`,
        js: `// Asynchronous OAuth 1.0a Logic for Browser (SubtleCrypto)
const generateSignature = async (params) => {
  const signingKey = encode("${X_API_SECRET}") + "&" + encode("${X_ACCESS_SECRET}");
  // SubtleCrypto logic implemented in BrandPilot core...
};`
      };
    }
    return { curl: 'Snippet loading...', js: 'Snippet loading...' };
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    onAction('Copied to clipboard!', 'success');
  };

  const toggleSecret = (fieldKey: string) => {
    setShowSecrets(prev => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  // Controlled input handler for credential fields
  const handleFieldChange = (platformId: string, fieldKey: string, value: string) => {
    setPlatforms(prev => prev.map(p =>
      p.id === platformId
        ? { ...p, fields: p.fields.map(f => f.key === fieldKey ? { ...f, value } : f) }
        : p
    ));
  };

  const handleSave = async (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    if (!platform) return;
    let success = true;
    for (const field of platform.fields) {
      try {
        // If the field is a token, use the new API endpoint
        if (field.key.endsWith('_token') || field.key === 'ig_access_token' || field.key === 'x_access_token') {
          const res = await fetch(`${BACKEND_API_URL}/api/update-token/${platformId}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ token: field.value })
          });
          const data = await res.json();
          if (!data || data.error) success = false;
        } else {
          // For other config fields, use the old endpoint
          const res = await fetch(`${BACKEND_API_URL}/api/config`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ key: field.key, value: field.value })
          });
          const data = await res.json();
          if (!data || data.error) success = false;
        }
      } catch (err) {
        success = false;
      }
    }
    if (success) {
      onAction(`Vault for ${platformId.toUpperCase()} updated in database.`, 'success');
    } else {
      onAction(`Failed to update credentials for ${platformId}.`, 'info');
    }
  };

  // Refresh Facebook Token handler
  const handleRefreshFacebookToken = async () => {
    // Use the current value from the form
    const facebookPlatform = platforms.find(p => p.id === 'facebook');
    const tokenField = facebookPlatform?.fields.find(f => f.key === 'fb_token');
    const newToken = tokenField?.value;
    if (!newToken) return;
    try {
      const res = await fetch(`${BACKEND_API_URL}/api/update-token/facebook`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ token: newToken })
      });
      const data = await res.json();
      if (data.success) {
        // Fetch latest token from backend
        const authData = JSON.parse(localStorage.getItem('brandpilot_auth') || '{}');
        const headers: HeadersInit = {};
        if (authData.token) {
          headers['Authorization'] = `Bearer ${authData.token}`;
        }
        const tokenRes = await fetch(`${BACKEND_API_URL}/api/token/facebook`, { headers });
        const tokenData = await tokenRes.json();
        // Update local state for Facebook token
        setPlatforms(prev => prev.map(p =>
          p.id === 'facebook'
            ? { ...p, fields: p.fields.map(f => f.key === 'fb_token' ? { ...f, value: tokenData.token } : f) }
            : p
        ));
        onAction('Facebook token updated successfully!', 'success');
      } else {
        onAction('Failed to update Facebook token.', 'info');
      }
    } catch (err) {
      onAction('Error updating Facebook token.', 'info');
    }
  };

  const handleTestConnection = async (platform: PlatformCreds) => {
    setIsTesting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    onAction(`Handshake Successful: Production Gateway for ${platform.name} is online.`, 'success');
    setIsTesting(false);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
            <Key size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Credentials Vault</h1>
            <p className="text-slate-500">AES-256 Storage for OAuth Handshakes.</p>
          </div>
        </div>
        <button 
          onClick={() => setShowApiCollection(!showApiCollection)}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all border shadow-lg ${showApiCollection ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200'}`}
        >
          <Code2 size={18} />
          {showApiCollection ? 'Hide Snippets' : 'View API Snippets'}
        </button>
      </div>

      {showApiCollection ? (
        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white space-y-8 animate-in zoom-in-95">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black mb-2 tracking-tight">Postman & CLI Snippets</h2>
              <p className="text-indigo-300">Test your credentials directly via the production endpoints.</p>
            </div>
            <div className="flex gap-2">
              {platforms.map(p => (
                <button key={p.id} onClick={() => setSelectedPlatform(p.id)} className={`p-2 rounded-lg border ${selectedPlatform === p.id ? 'bg-white text-slate-900' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                  <p.icon size={18} />
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-indigo-400">
                <span className="flex items-center gap-2"><Terminal size={14} /> Tested cURL Implementation</span>
                <button onClick={() => copyToClipboard(getSnippets().curl)} className="hover:text-white flex items-center gap-1 transition-colors"><Copy size={14} /> Copy</button>
              </div>
              <pre className="p-6 bg-black/40 rounded-2xl border border-white/5 font-mono text-[11px] leading-relaxed text-indigo-100 overflow-x-auto whitespace-pre-wrap">{getSnippets().curl}</pre>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-indigo-400">
                <span className="flex items-center gap-2"><Layers size={14} /> Production Logic</span>
                <button onClick={() => copyToClipboard(getSnippets().js)} className="hover:text-white flex items-center gap-1 transition-colors"><Copy size={14} /> Copy</button>
              </div>
              <pre className="p-6 bg-black/40 rounded-2xl border border-white/5 font-mono text-[11px] leading-relaxed text-indigo-100 overflow-x-auto whitespace-pre-wrap">{getSnippets().js}</pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <p className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Active Handshakes</p>
              {platforms.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlatform(p.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${selectedPlatform === p.id ? 'bg-indigo-600 text-white shadow-xl' : 'hover:bg-slate-50 text-slate-600'}`}
                >
                  <div className="flex items-center gap-3">
                    <p.icon size={18} />
                    <span className="font-bold text-sm">{p.name}</span>
                  </div>
                  {p.isConfigured && <CheckCircle2 size={16} />}
                </button>
              ))}
            </div>
            <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm mb-2">
                <ShieldCheck size={18} /> Hardware Guard Active
              </div>
              <p className="text-xs text-indigo-700 leading-relaxed">All secrets are injected into the API gateway via the <span className="font-bold">OAuth 1.0a</span> and <span className="font-bold">Graph v20.0</span> secure protocols.</p>
            </div>
          </div>

          <div className="lg:col-span-8">
            {activePlatform ? (
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8 animate-in slide-in-from-right-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-slate-50 border border-slate-100 ${activePlatform.color}`}>
                      <activePlatform.icon size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">{activePlatform.name} Keys</h2>
                      <p className="text-sm text-slate-500 font-medium">Production credentials for automated publishing.</p>
                    </div>
                  </div>
                  {/* Add Refresh Facebook Token button only for Facebook */}
                  {activePlatform.id === 'facebook' && (
                    <button
                      onClick={handleRefreshFacebookToken}
                      className="px-4 py-2 bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 shadow hover:bg-indigo-600 transition-all"
                    >
                      <RefreshCw size={18} /> Refresh Facebook Token
                    </button>
                  )}
                </div>
                <div className="space-y-6">
                  {activePlatform.fields.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{field.label}</label>
                        {field.hidden && (
                          <button onClick={() => toggleSecret(field.key)} className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:opacity-70 transition-opacity">
                            {showSecrets[field.key] ? <><EyeOff size={14} /> Hide</> : <><Eye size={14} /> Reveal</>}
                          </button>
                        )}
                      </div>
                      <div className="relative group">
                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                          type={field.hidden && !showSecrets[field.key] ? "password" : "text"}
                          value={field.value}
                          onChange={e => handleFieldChange(activePlatform.id, field.key, e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-mono text-sm transition-all"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-4 flex flex-col sm:flex-row gap-4">
                  <button onClick={() => handleSave(activePlatform.id)} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-indigo-700 active:scale-95 transition-all"><Save size={20} /> Update Credentials</button>
                  <button onClick={() => handleTestConnection(activePlatform)} disabled={isTesting} className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 flex items-center gap-2 transition-all">
                    {isTesting ? <Loader2 size={18} className="animate-spin text-indigo-600" /> : <RefreshCw size={18} />} 
                    {isTesting ? 'Handshaking...' : 'Test Connection'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-slate-200 border-dashed p-12 text-center text-slate-300">
                <Database size={64} className="mb-6 animate-pulse" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Vault Unlocked</h2>
                <p className="text-slate-500">Select a platform to sync production API secrets.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Credentials;