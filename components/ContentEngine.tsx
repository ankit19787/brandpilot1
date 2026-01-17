
// Fixed React namespace error by adding React import
import React, { useState, useEffect } from 'react';
import { 
  PenTool, 
  Send, 
  Copy, 
  RotateCcw, 
  Loader2, 
  Sparkles, 
  Zap, 
  Calendar, 
  Clock, 
  X as CloseIcon, 
  Check, 
  Globe,
  Twitter,
  Instagram,
  Terminal,
  MessageCircle,
  ToggleLeft,
  ToggleRight,
  Subtitles,
  Facebook,
  ExternalLink,
  ChevronRight,
  ImageIcon,
  Edit3,
  ImagePlus,
  Link as LinkIcon,
  Lock
} from 'lucide-react';
import { generatePost, platformAPI, generateImage, createPost } from '../services/gemini.client';
import { deductCredits, getMonthlyPostCount, canCreatePost } from '../services/creditService';
import { canAccessPlatform, CREDIT_COSTS, getPlanLimits } from '../services/planService';
import { BrandDNA, ContentItem } from '../types';
import CreditsWarning from './CreditsWarning';

interface ContentEngineProps {
  dna: BrandDNA | null;
  initialTopic?: string;
  onAction: (msg: string, type?: 'success' | 'info') => void;
  onSchedulePost: (post: ContentItem) => void;
  autoPostEnabled: boolean;
  onToggleAutoPost: (val: boolean) => void;
  userPlan?: { plan: string; credits: number; maxCredits: number };
  onUpgrade: () => void;
  onCreditsUpdate: (newCredits: number) => void;
}

const ContentEngine: React.FC<ContentEngineProps> = ({ 
  dna, 
  initialTopic = '', 
  onAction, 
  onSchedulePost,
  autoPostEnabled,
  onToggleAutoPost,
  userPlan = { plan: 'pro', credits: 0, maxCredits: 10000 },
  onUpgrade,
  onCreditsUpdate
}) => {
  // Multi-select platform state
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['Instagram']);
  // For backward compatibility, keep single platform for now
  const [platform, setPlatform] = useState('Instagram');
  const [topic, setTopic] = useState(initialTopic);
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  
  const planLimits = getPlanLimits(userPlan.plan);
  const [ytTitle, setYtTitle] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  
  // States for images
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [manualImageUrl, setManualImageUrl] = useState('');
  const [localUploadedFile, setLocalUploadedFile] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [generatingVisuals, setGeneratingVisuals] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState('');
  const [apiLogs, setApiLogs] = useState<string[]>([]);
  const [showScheduler, setShowScheduler] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [postToAllPlatforms, setPostToAllPlatforms] = useState(false);
  
  const [postUrl, setPostUrl] = useState<string | null>(null);
  
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleTime, setScheduleTime] = useState('09:00');

  const connectedPlatforms = ['X (Twitter)', 'Instagram', 'Facebook'];
  const visualPlatforms = ['Instagram', 'Facebook'];

  useEffect(() => {
    if (initialTopic) {
      setTopic(initialTopic);
      resetPreview();
    }
  }, [initialTopic]);

  const resetPreview = () => {
    setGeneratedContent('');
    setGeneratedImageUrl(null);
    setLocalUploadedFile(null);
    // Keep manualImageUrl - don't clear it
    setShowScheduler(false);
    setPostUrl(null);
  };

  const handleGenerate = async () => {
    if (!topic && !isManualMode) return;

    setLoading(true);
    resetPreview();

    const activeDna = dna || { voice: 'Professional', personality: [], contentPillars: [], audienceType: '', writingStyle: '' };

    try {
      // Use first selected platform for content generation
      const mainPlatform = selectedPlatforms[0] || platform;
      const textResult = await generatePost(mainPlatform, topic, activeDna);
      setGeneratedContent(textResult);
      setLoading(false); // Text is ready, UI is interactive

      // 2. Visual Synthesis (Priority 2 - Background) - Only if no manual URL provided and no image already generated
      if (visualPlatforms.includes(mainPlatform) && !manualImageUrl && !generatedImageUrl) {
        setGeneratingVisuals(true);
        try {
          const imageResult = await generateImage(topic, activeDna);
          setGeneratedImageUrl(imageResult);
        } catch (imgErr) {
          console.error("Visual gen failed:", imgErr);
        } finally {
          setGeneratingVisuals(false);
        }
      }
      onAction('Narrative ready. Visuals finalizing...', 'success');
    } catch (error) {
      console.error(error);
      onAction('Synthesis failed.');
      setLoading(false);
    }
  };

  // Fixed React.ChangeEvent by ensuring React is imported
  const handleManualUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalUploadedFile(reader.result as string);
        setManualImageUrl(''); 
        setGeneratedImageUrl(null);
        onAction('Asset uploaded.', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const getTargetImage = () => {
    // For posting: prioritize manual URL for consistency
    return manualImageUrl || localUploadedFile || generatedImageUrl || null;
  };

  const getPreviewImage = () => {
    // If manual URL is provided, ONLY show that - don't fall back to generated/uploaded
    if (manualImageUrl) {
      return manualImageUrl;
    }
    // Otherwise show uploaded or generated
    return localUploadedFile || generatedImageUrl || null;
  };;

  const handlePostNow = async () => {
    if (postToAllPlatforms) {
      await handlePostToAllPlatforms();
      return;
    }

    // Use selected platforms for posting
    const platformsToPost = selectedPlatforms.length > 0 ? selectedPlatforms : [platform];
    for (const plt of platformsToPost) {
      if (!connectedPlatforms.includes(plt)) {
        onAction(`Gateway for ${plt} is not authorized.`);
        continue;
      }

      setPublishing(true);
      setApiLogs([]);
      try {
        const targetImage = getTargetImage();
        const response = await platformAPI.publish(
          plt, 
          generatedContent, 
          (status) => {
            setPublishStatus(status);
            setApiLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${status}`]);
          }, 
          { imageUrl: targetImage || undefined }
        );
        
        // Save post to database
        try {
          await createPost({
            userId: 'default_user', // You can replace with actual user ID if you have authentication
            platform: plt,
            content: generatedContent,
            imageUrl: targetImage || undefined,
            status: 'published',
            scheduledFor: undefined
          });
        } catch (dbError) {
          console.error('Failed to save post to database:', dbError);
          // Don't fail the publish if database save fails
        }
        
        onAction(`Production Publish Success on ${plt}!`, 'success');
        setPostUrl(response.url);
        resetPreview();
        setTopic('');
      } catch (error: any) {
        onAction(error.message || `API Gateway Timeout.`);
      } finally {
        setPublishing(false);
      }
    }
  };

  const handlePostToAllPlatforms = async () => {
    const targetImage = getTargetImage();
    const platformsToPost = platformsList.filter(p => connectedPlatforms.includes(p.name));

    if (platformsToPost.length === 0) {
      onAction(`No connected platforms available.`);
      return;
    }

    setPublishing(true);
    setApiLogs([]);
    let successCount = 0;
    let failureCount = 0;

    for (const plt of platformsToPost) {
      try {
        onAction(`Publishing to ${plt.name}...`);
        setPublishStatus(`Publishing to ${plt.name}...`);
        setApiLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Publishing to ${plt.name}...`]);

        const response = await platformAPI.publish(
          plt.name,
          generatedContent,
          (status) => {
            setPublishStatus(status);
            setApiLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${status}`]);
          },
          { imageUrl: targetImage || undefined }
        );

        // Save post to database
        try {
          await createPost({
            userId: 'default_user',
            platform: plt.name,
            content: generatedContent,
            imageUrl: targetImage || undefined,
            status: 'published',
            scheduledFor: undefined
          });
        } catch (dbError) {
          console.error('Failed to save post to database:', dbError);
        }

        successCount++;
        setApiLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✓ ${plt.name} published successfully`]);
      } catch (error: any) {
        failureCount++;
        const errorMsg = error?.message || "Unknown error";
        setApiLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✗ ${plt.name} failed: ${errorMsg}`]);
      }
    }

    setPublishing(false);
    onAction(`Published to ${successCount}/${platformsToPost.length} platforms${failureCount > 0 ? ` (${failureCount} failed)` : ''}`, successCount > 0 ? 'success' : undefined);
    if (successCount > 0) {
      resetPreview();
      setTopic('');
    }
  };

  const confirmSchedule = () => {
    const scheduledAt = `${scheduleDate}T${scheduleTime}:00`;
    
    if (postToAllPlatforms) {
      // Schedule for all connected platforms
      const platformsToSchedule = platformsList.filter(p => connectedPlatforms.includes(p.name));
      platformsToSchedule.forEach(plt => {
        onSchedulePost({
          id: Math.random().toString(36).substr(2, 9),
          platform: plt.name,
          content: generatedContent,
          imageUrl: getTargetImage() || undefined,
          status: 'Scheduled',
          scheduledFor: scheduledAt,
          createdAt: new Date().toISOString()
        });
      });
      onAction(`Posts scheduled for ${platformsToSchedule.length} platforms at ${scheduleTime}`, 'success');
    } else {
      // Schedule for selected platforms
      const platformsToSchedule = selectedPlatforms.length > 0 ? selectedPlatforms : [platform];
      platformsToSchedule.forEach(plt => {
        onSchedulePost({
          id: Math.random().toString(36).substr(2, 9),
          platform: plt,
          content: generatedContent,
          imageUrl: getTargetImage() || undefined,
          status: 'Scheduled',
          scheduledFor: scheduledAt,
          createdAt: new Date().toISOString()
        });
      });
      onAction(`Post queued for ${platformsToSchedule.length} platform(s) at ${scheduleTime}`, 'success');
    }
    
    resetPreview();
    setTopic('');
  };

  const platformsList = [
    { name: 'Instagram', icon: Instagram, color: 'text-pink-600' },
    { name: 'Facebook', icon: Facebook, color: 'text-blue-700' },
    { name: 'X (Twitter)', icon: Twitter, color: 'text-sky-500' },
  ];
  
  const availablePlatformNames = planLimits.platforms;
  const availablePlatforms = platformsList.filter(p => availablePlatformNames.includes(p.name));
  const lockedPlatforms = [
    { name: 'LinkedIn', icon: Globe, color: 'text-blue-600', locked: !availablePlatformNames.includes('LinkedIn') },
    { name: 'YouTube', icon: Terminal, color: 'text-red-600', locked: !availablePlatformNames.includes('YouTube') },
  ].filter(p => p.locked);

  const currentPreviewImage = getPreviewImage();
  const showOnlyManualUrl = manualImageUrl && !manualImageUrl.startsWith('blob:');

  return (
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
            <PenTool size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Content Engine</h1>
            <p className="text-slate-500">Instant AI drafts and manual production controls.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
            <button 
                onClick={() => setIsManualMode(!isManualMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all border ${isManualMode ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
                <Edit3 size={14} />
                {isManualMode ? 'Manual Composer' : 'AI Draft Mode'}
            </button>
            <button onClick={() => onToggleAutoPost(!autoPostEnabled)} className={`p-4 rounded-2xl border flex items-center gap-6 transition-all ${autoPostEnabled ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl' : 'bg-white text-slate-600 border-slate-200'}`}>
                <div className="flex flex-col text-right">
                    <span className="text-xs font-black uppercase tracking-widest leading-none mb-1">AI Agent</span>
                    <span className={`text-[10px] font-medium ${autoPostEnabled ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {autoPostEnabled ? 'Monitoring' : 'Standby'}
                    </span>
                </div>
                {autoPostEnabled ? <ToggleRight size={40} className="text-white fill-current" /> : <ToggleLeft size={40} className="text-slate-300" />}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-8">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-4">Select Target Platforms</label>
              <CreditsWarning
                currentCredits={userPlan.credits}
                requiredCredits={CREDIT_COSTS.generatePost}
                action="generate content"
                onUpgrade={onUpgrade}
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availablePlatforms.map((p) => {
                  const Icon = p.icon;
                  const isSelected = selectedPlatforms.includes(p.name);
                  return (
                    <button
                      key={p.name}
                      type="button"
                      disabled={loading || publishing || postToAllPlatforms}
                      onClick={() => {
                        if (postToAllPlatforms) return;
                        setSelectedPlatforms((prev) =>
                          prev.includes(p.name)
                            ? prev.filter((name) => name !== p.name)
                            : [...prev, p.name]
                        );
                        setPlatform(p.name);
                      }}
                      className={`px-3 py-4 rounded-xl border font-bold text-xs transition-all flex items-center gap-2 relative ${
                        isSelected 
                          ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      } ${postToAllPlatforms ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className="mr-2 accent-indigo-600"
                        tabIndex={-1}
                        style={{ pointerEvents: 'none' }}
                      />
                      <Icon size={16} className={isSelected ? 'text-white' : p.color} />
                      <span className="truncate">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <button
                onClick={() => setPostToAllPlatforms(!postToAllPlatforms)}
                className={`w-full px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-between ${
                  postToAllPlatforms
                    ? 'bg-purple-600 text-white border-purple-600 shadow-lg'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-purple-400 hover:bg-purple-50'
                }`}
              >
                <span>📤 Post to All Platforms</span>
                <span className="text-xs opacity-75">{postToAllPlatforms ? 'ON' : 'OFF'}</span>
              </button>
              {postToAllPlatforms && (
                <p className="text-xs text-slate-500 mt-3 text-center">
                  ✓ Content will be posted to all {platformsList.filter(p => connectedPlatforms.includes(p.name)).length} connected platforms
                </p>
              )}
            </div>

            {!postToAllPlatforms && visualPlatforms.includes(platform) && (
              <div className="animate-in slide-in-from-top-2 space-y-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Public Image URL (Meta API Recommended)</label>
                <div className="relative">
                  <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={manualImageUrl}
                    onChange={(e) => setManualImageUrl(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>
            )}

            {postToAllPlatforms && visualPlatforms.some(p => platformsList.find(plt => plt.name === p && connectedPlatforms.includes(p))) && (
              <div className="animate-in slide-in-from-top-2 space-y-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Public Image URL (Meta API Recommended)</label>
                <div className="relative">
                  <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={manualImageUrl}
                    onChange={(e) => setManualImageUrl(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>
            )}

            {!isManualMode && (
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-4">Post Context</label>
                    <textarea
                        className="w-full h-40 p-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none text-slate-700 text-sm font-medium"
                        placeholder={`What should the AI draft for ${platform}?`}
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                    />
                </div>
            )}

            <button
                onClick={handleGenerate}
                disabled={loading || publishing || (!topic && !isManualMode)}
                className={`w-full py-5 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50`}
            >
                {loading ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={20} />}
                {loading ? 'Synthesizing Narrative...' : 'Draft Post Package'}
            </button>
          </div>

          <div className="bg-slate-900 text-slate-400 p-8 rounded-[2rem] border border-slate-800">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-widest">
              <Terminal size={16} className="text-indigo-400" /> API Gateway Logs
            </h3>
            <div className="space-y-2 font-mono text-[11px]">
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span>PROTOCOL</span>
                <span className="text-indigo-400 font-black uppercase">{platform === 'X (Twitter)' ? 'OAUTH_1.0a_HMAC' : 'GRAPH_v20.0'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span>RESOURCES</span>
                <span className="text-amber-400 uppercase">{manualImageUrl ? 'REMOTE_PUBLIC' : localUploadedFile ? 'LOCAL_BUFFER' : generatedImageUrl ? 'AI_GENERATED' : 'TEXT_ONLY'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm min-h-[500px] flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">Resource Preview</h2>
              {(generatedContent || isManualMode) && !publishing && (
                <div className="flex gap-2">
                  <button onClick={() => { navigator.clipboard.writeText(generatedContent); onAction('Copied!', 'success'); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Copy size={18} /></button>
                </div>
              )}
            </div>

            <div className={`flex-1 rounded-2xl p-6 border transition-all ${generatedContent || postUrl || isManualMode ? 'bg-slate-50 border-slate-100' : 'bg-slate-50/50 border-slate-100 border-dashed flex items-center justify-center'}`}>
              {postUrl ? (
                <div className="flex flex-col items-center justify-center h-full space-y-6 text-center animate-in zoom-in-95">
                    <div className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xl">
                        <Check size={32} />
                    </div>
                    <h3 className="text-xl font-bold">Post Published Successfully!</h3>
                    <button onClick={() => setPostUrl(null)} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95">Next Draft <ChevronRight size={18} className="inline ml-1" /></button>
                </div>
              ) : (generatedContent || isManualMode || loading) ? (
                <div className="space-y-4 h-full flex flex-col">
                  {visualPlatforms.includes(platform) && (
                    <div className="relative group">
                      {generatingVisuals ? (
                        <div className="w-full h-48 bg-slate-200 animate-pulse rounded-xl flex items-center justify-center flex-col gap-2">
                          <Loader2 className="animate-spin text-indigo-400" size={24} />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Synthesizing Visual Identity...</span>
                        </div>
                      ) : currentPreviewImage ? (
                        <div className="relative">
                            <img 
                                src={currentPreviewImage} 
                                alt="Preview" 
                                className="w-full max-h-56 object-cover rounded-xl border border-slate-200 shadow-md animate-in fade-in" 
                                onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=800"; }}
                            />
                            <div className="absolute top-2 right-2 space-x-2 flex items-center">
                              {showOnlyManualUrl && <span className="inline-block bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">PUBLIC URL</span>}
                              <button onClick={() => { setGeneratedImageUrl(null); setLocalUploadedFile(null); setManualImageUrl(''); }} className="inline-block bg-rose-500 text-white p-1 rounded-full shadow-lg"><CloseIcon size={12} /></button>
                            </div>
                        </div>
                      ) : (
                        <label className="w-full h-40 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center bg-white cursor-pointer hover:bg-slate-50 transition-all">
                            <ImagePlus size={24} className="text-slate-300 mb-2" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upload Resource</p>
                            <input type="file" className="hidden" accept="image/*" onChange={handleManualUploadImage} />
                        </label>
                      )}
                    </div>
                  )}

                  {loading && !generatedContent ? (
                    <div className="w-full flex-1 bg-white p-4 rounded-xl border border-slate-200 flex flex-col gap-3 animate-pulse">
                        <div className="h-4 bg-slate-100 rounded-full w-3/4"></div>
                        <div className="h-4 bg-slate-100 rounded-full w-full"></div>
                        <div className="h-4 bg-slate-100 rounded-full w-5/6"></div>
                    </div>
                  ) : (
                    <textarea 
                        className={`w-full flex-1 bg-white p-4 rounded-xl border border-slate-200 text-sm leading-relaxed resize-none focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm font-medium text-slate-700 ${loading ? 'opacity-50' : ''}`}
                        placeholder="Draft content will appear here..."
                        value={generatedContent}
                        onChange={(e) => setGeneratedContent(e.target.value)}
                    />
                  )}
                </div>
              ) : (
                <div className="text-center opacity-30">
                  <Globe size={40} className="mx-auto mb-2 text-slate-400" />
                  <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">Waiting for Input</p>
                </div>
              )}
            </div>

            {publishing && (
                <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex flex-col p-8 text-white animate-in fade-in">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-black uppercase tracking-tighter">Production Gateway</h3>
                    <Loader2 className="animate-spin" size={20} />
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[10px] text-indigo-300">
                    {apiLogs.map((log, i) => ( <div key={i} className="animate-in slide-in-from-left">[{i+1}] {log}</div> ))}
                  </div>
                  <div className="mt-4 text-center font-bold text-xs uppercase tracking-widest opacity-60 animate-pulse">{publishStatus}</div>
                </div>
            )}

            {(generatedContent || isManualMode) && !publishing && !postUrl && (
              <div className="mt-8 grid grid-cols-2 gap-4">
                <button onClick={handlePostNow} className="py-4 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"><Send size={18} /> {postToAllPlatforms ? 'Push All Platforms' : 'Push Live'}</button>
                <button onClick={() => setShowScheduler(!showScheduler)} className={`py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border active:scale-95 ${showScheduler ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200'}`}><Calendar size={18} /> Schedule</button>
              </div>
            )}

            {showScheduler && (
                <div className="mt-4 p-4 bg-indigo-50 rounded-xl space-y-4 animate-in slide-in-from-top-2 border border-indigo-100">
                    <div className="grid grid-cols-2 gap-4">
                        <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="w-full p-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                        <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="w-full p-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <button onClick={confirmSchedule} className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700">{postToAllPlatforms ? 'Schedule for All' : 'Add to Queue'}</button>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentEngine;
