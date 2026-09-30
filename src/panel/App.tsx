import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Navbar 
} from './components/Navbar';
import { 
  CommandBar 
} from './components/CommandBar';
import { 
  VideoTable 
} from './components/VideoTable';
import { 
  DiffPreview 
} from './components/DiffPreview';
import { 
  ProgressModal 
} from './components/ProgressModal';
import { 
  PaywallModal 
} from './components/PaywallModal';

import { 
  YouTubeChannel, 
  YouTubeVideoItem, 
  getChannelDetails, 
  getChannelVideos, 
  executeBatchUpdate, 
  updateVideoDescription,
  BatchUpdateProgress,
  MOCK_CHANNEL,
  MOCK_VIDEOS
} from '../lib/youtube';
import { 
  calculateDiff, 
  DiffResult 
} from '../lib/diffEngine';
import { 
  getLicenseState, 
  canPerformBatchSwap, 
  markFreeTrialUsed, 
  LicenseState 
} from '../lib/licensing';
import { 
  getStorageData, 
  setStorageData 
} from '../lib/storage';

export default function PanelApp() {
  // Channel & Video Data State
  const [channel, setChannel] = useState<YouTubeChannel | null>(null);
  const [videos, setVideos] = useState<YouTubeVideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Search & Replace Command State
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);

  // Video Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Licensing & Business Model State
  const [license, setLicense] = useState<LicenseState>({
    isPro: false,
    freeTrialUsed: false,
    canExecuteTrial: true,
  });

  // Quota Tracking
  const [quotaUsed, setQuotaUsed] = useState(0);
  const maxQuota = 10000;

  // Modals
  const [diffModalOpen, setDiffModalOpen] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<YouTubeVideoItem | null>(null);

  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [batchProgress, setBatchProgress] = useState<BatchUpdateProgress | null>(null);

  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallReason, setPaywallReason] = useState<'NEED_PRO_FOR_MULTI' | 'TRIAL_EXHAUSTED' | 'GENERAL'>('GENERAL');

  // Initial Data Fetch
  useEffect(() => {
    loadLicense();
    loadPreferences();
    loadChannelData();
  }, []);

  const loadLicense = async () => {
    const lic = await getLicenseState();
    setLicense(lic);
  };

  const loadPreferences = async () => {
    const data = await getStorageData(['preferences', 'apiQuota']);
    if (data.preferences) {
      setUseRegex(Boolean(data.preferences.useRegex));
      setCaseSensitive(Boolean(data.preferences.caseSensitive));
    }
    if (data.apiQuota) {
      setQuotaUsed(data.apiQuota.unitsUsed || 0);
    }
  };

  const loadChannelData = async () => {
    setIsLoading(true);
    setErrorBanner(null);

    try {
      // Attempt live OAuth2 fetch via chrome.identity
      const channelDetails = await getChannelDetails();
      setChannel(channelDetails);

      const videoData = await getChannelVideos(channelDetails.uploadsPlaylistId, 50);
      setVideos(videoData.videos);

      // Select all by default
      setSelectedIds(new Set(videoData.videos.map((v) => v.id)));
    } catch (err: any) {
      console.warn('Live YouTube API unavailable or not logged in, falling back to mock catalog:', err);
      // Fallback to rich mock catalog for testing and instant preview
      setChannel(MOCK_CHANNEL);
      setVideos(MOCK_VIDEOS);
      setSelectedIds(new Set(MOCK_VIDEOS.map((v) => v.id)));
      
      // Default sample search query so user immediately sees tactile diffs
      setSearchQuery('https://amzn.to/old-sponsor-link-v1');
      setReplaceQuery('https://amzn.to/new-2026-partner-tag');
    } finally {
      setIsLoading(false);
    }
  };

  // Compute Diffs for every video whenever search, replace, regex, or video descriptions change
  const diffsByVideoId = useMemo<Record<string, DiffResult>>(() => {
    const map: Record<string, DiffResult> = {};
    videos.forEach((video) => {
      map[video.id] = calculateDiff(video.description, searchQuery, replaceQuery, {
        useRegex,
        caseSensitive,
      });
    });
    return map;
  }, [videos, searchQuery, replaceQuery, useRegex, caseSensitive]);

  // Aggregate Metrics
  const { totalMatches, matchingVideosCount } = useMemo(() => {
    let matches = 0;
    let count = 0;
    Object.values(diffsByVideoId).forEach((diff) => {
      if (diff.matchCount > 0) {
        matches += diff.matchCount;
        count += 1;
      }
    });
    return { totalMatches: matches, matchingVideosCount: count };
  }, [diffsByVideoId]);

  // Selection Handlers
  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(videos.map((v) => v.id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  // Toggle Handlers
  const handleToggleRegex = async () => {
    const nextVal = !useRegex;
    setUseRegex(nextVal);
    await setStorageData({ preferences: { useRegex: nextVal, caseSensitive, searchScope: 'descriptions' } });
  };

  const handleToggleCaseSensitive = async () => {
    const nextVal = !caseSensitive;
    setCaseSensitive(nextVal);
    await setStorageData({ preferences: { useRegex, caseSensitive: nextVal, searchScope: 'descriptions' } });
  };

  // Inspect Diff for a specific video
  const handleInspectDiff = (video: YouTubeVideoItem) => {
    setPreviewVideo(video);
    setDiffModalOpen(true);
  };

  // Open Preview for the first selected matching video
  const handleOpenGeneralPreview = () => {
    const targetVideo = videos.find((v) => selectedIds.has(v.id) && (diffsByVideoId[v.id]?.matchCount || 0) > 0) 
      || videos.find((v) => (diffsByVideoId[v.id]?.matchCount || 0) > 0)
      || videos[0];

    if (targetVideo) {
      handleInspectDiff(targetVideo);
    }
  };

  // Apply single replacement directly from DiffPreview
  const handleApplySingle = async (video: YouTubeVideoItem, newDescription: string) => {
    // Check 1-video trial or Pro status
    const check = await canPerformBatchSwap(1);
    if (!check.allowed) {
      setDiffModalOpen(false);
      setPaywallReason(check.reason === 'TRIAL_EXHAUSTED' ? 'TRIAL_EXHAUSTED' : 'GENERAL');
      setPaywallOpen(true);
      return;
    }

    try {
      await updateVideoDescription(video.id, newDescription);
      
      // Update local state
      setVideos((prev) =>
        prev.map((v) => (v.id === video.id ? { ...v, description: newDescription } : v))
      );

      // If free user, exhaust trial
      if (!license.isPro) {
        await markFreeTrialUsed();
        await loadLicense();
      }

      setDiffModalOpen(false);
    } catch (err: any) {
      alert(`Failed to update video: ${err.message}`);
    }
  };

  // Master Batch Swap Trigger
  const handleTriggerSwap = async () => {
    const targets = videos.filter(
      (v) => selectedIds.has(v.id) && (diffsByVideoId[v.id]?.matchCount || 0) > 0
    );

    if (targets.length === 0) {
      alert('None of the selected videos contain the search pattern.');
      return;
    }

    // Check licensing rules:
    // - Free users: Strictly 1 video trial
    // - Pro users: Unlimited
    const check = await canPerformBatchSwap(targets.length);
    if (!check.allowed) {
      setPaywallReason(check.reason === 'NEED_PRO_FOR_MULTI' ? 'NEED_PRO_FOR_MULTI' : 'TRIAL_EXHAUSTED');
      setPaywallOpen(true);
      return;
    }

    // Check 5,000 char overflows
    const overflows = targets.filter((v) => diffsByVideoId[v.id]?.exceedsLimit);
    if (overflows.length > 0) {
      const confirmProceed = window.confirm(
        `Warning: ${overflows.length} of the selected videos will exceed YouTube's 5,000 character limit after replacement. YouTube will reject descriptions over 5,000 characters. Do you want to proceed?`
      );
      if (!confirmProceed) return;
    }

    // Prepare batch items
    const batchItems = targets.map((v) => ({
      videoId: v.id,
      title: v.title,
      newDescription: diffsByVideoId[v.id].modifiedText,
    }));

    // Open Progress Modal
    setProgressModalOpen(true);
    setBatchProgress({
      currentIndex: 0,
      total: batchItems.length,
      currentVideoId: '',
      currentVideoTitle: '',
      status: 'pending',
      updatedVideos: [],
      failedVideos: [],
    });

    try {
      const finalProgress = await executeBatchUpdate(batchItems, (prog) => {
        setBatchProgress({ ...prog });
      });

      // Update local state with modified descriptions for successful videos
      setVideos((prev) =>
        prev.map((v) => {
          if (finalProgress.updatedVideos.includes(v.id)) {
            return {
              ...v,
              description: diffsByVideoId[v.id]?.modifiedText || v.description,
            };
          }
          return v;
        })
      );

      // If free user, mark free trial as used
      if (!license.isPro) {
        await markFreeTrialUsed();
        await loadLicense();
      }
    } catch (err: any) {
      console.error('Batch update failed:', err);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-obsidian text-zinc-100 font-sans select-none overflow-hidden relative">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Navbar */}
      <Navbar
        channel={channel}
        license={license}
        quotaUsed={quotaUsed}
        maxQuota={maxQuota}
        isLoading={isLoading}
        onRefresh={loadChannelData}
        onSignIn={loadChannelData}
        onSignOut={() => {
          setChannel(null);
          setVideos([]);
        }}
        onOpenPaywall={() => {
          setPaywallReason('GENERAL');
          setPaywallOpen(true);
        }}
      />

      {/* Command Bar: Tactile Find & Replace */}
      <CommandBar
        searchQuery={searchQuery}
        replaceQuery={replaceQuery}
        useRegex={useRegex}
        caseSensitive={caseSensitive}
        totalMatches={totalMatches}
        matchingVideosCount={matchingVideosCount}
        selectedCount={selectedIds.size}
        onSearchChange={setSearchQuery}
        onReplaceChange={setReplaceQuery}
        onToggleRegex={handleToggleRegex}
        onToggleCaseSensitive={handleToggleCaseSensitive}
        onOpenPreview={handleOpenGeneralPreview}
        onTriggerSwap={handleTriggerSwap}
        isPro={license.isPro}
      />

      {/* Error or Notice Banner if any */}
      {errorBanner && (
        <div className="px-4 py-2 bg-rose-500/10 border-b border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
          <span>{errorBanner}</span>
          <button onClick={() => setErrorBanner(null)} className="text-rose-400 hover:text-rose-200">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Video Catalog Table */}
      <VideoTable
        videos={videos}
        diffsByVideoId={diffsByVideoId}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onInspectDiff={handleInspectDiff}
        isPro={license.isPro}
        freeTrialUsed={license.freeTrialUsed}
      />

      {/* Bottom Status Ribbon */}
      <footer className="px-4 py-2.5 bg-obsidian-200/90 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>YouTube Studio Connected</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{selectedIds.size} / {videos.length} videos targeted</span>
          <span>•</span>
          <span className="text-emerald-400 font-semibold">{totalMatches} matches found</span>
        </div>
      </footer>

      {/* Git Diff Preview Modal */}
      <DiffPreview
        isOpen={diffModalOpen}
        video={previewVideo}
        diff={previewVideo ? diffsByVideoId[previewVideo.id] : null}
        onClose={() => setDiffModalOpen(false)}
        onApplySingle={handleApplySingle}
      />

      {/* Live Batch Progress Modal */}
      <ProgressModal
        isOpen={progressModalOpen}
        progress={batchProgress}
        onClose={() => setProgressModalOpen(false)}
      />

      {/* Paywall & License Activation Modal */}
      <PaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        onLicenseActivated={async () => {
          await loadLicense();
        }}
        reason={paywallReason}
        currentLicense={license}
      />
    </div>
  );
}
