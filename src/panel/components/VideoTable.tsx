import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckSquare, 
  Square, 
  ExternalLink, 
  FileText, 
  Eye, 
  Calendar, 
  Check, 
  AlertTriangle,
  Play
} from 'lucide-react';
import { YouTubeVideoItem } from '../../lib/youtube';
import { DiffResult } from '../../lib/diffEngine';

interface VideoTableProps {
  videos: YouTubeVideoItem[];
  diffsByVideoId: Record<string, DiffResult>;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onInspectDiff: (video: YouTubeVideoItem) => void;
  isPro: boolean;
  freeTrialUsed: boolean;
}

export const VideoTable: React.FC<VideoTableProps> = ({
  videos,
  diffsByVideoId,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onInspectDiff,
  isPro,
  freeTrialUsed,
}) => {
  const allSelected = videos.length > 0 && videos.every((v) => selectedIds.has(v.id));
  const someSelected = videos.some((v) => selectedIds.has(v.id)) && !allSelected;

  const formatViewCount = (count?: string) => {
    if (!count) return '0 views';
    const num = parseInt(count, 10);
    if (isNaN(num)) return count;
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M views';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K views';
    return `${num} views`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (videos.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-zinc-500">
        <FileText className="w-12 h-12 stroke-[1.2] mb-3 text-zinc-600" />
        <p className="text-sm font-medium text-zinc-300">No YouTube Videos Loaded</p>
        <p className="text-xs text-zinc-500 max-w-sm mt-1">
          Connect your Google Account or click Refresh to sync your channel's public & unlisted video catalog.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 overflow-y-auto">
      {/* Table Header */}
      <div className="sticky top-0 z-20 px-4 py-2 bg-obsidian-200/95 backdrop-blur-md border-b border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="flex items-center gap-2 hover:text-zinc-200 transition-colors"
          >
            {allSelected ? (
              <CheckSquare className="w-4 h-4 text-emerald-400" />
            ) : someSelected ? (
              <div className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500 flex items-center justify-center">
                <div className="w-2 h-0.5 bg-emerald-400" />
              </div>
            ) : (
              <Square className="w-4 h-4 text-zinc-600" />
            )}
            <span className="font-medium text-zinc-300">
              {selectedIds.size > 0 ? `${selectedIds.size} Selected` : 'Select All'}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-zinc-500">
          <span>{videos.length} videos total</span>
          {!isPro && (
            <span className="text-amber-400/90 font-medium">
              {freeTrialUsed ? 'Pro required for multi-swap' : '1 video free trial'}
            </span>
          )}
        </div>
      </div>

      {/* Video Row Items */}
      <div className="divide-y divide-zinc-800/50">
        {videos.map((video) => {
          const isSelected = selectedIds.has(video.id);
          const diff = diffsByVideoId[video.id];
          const matchCount = diff?.matchCount || 0;
          const exceedsLimit = diff?.exceedsLimit || false;

          return (
            <motion.div
              key={video.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              onClick={() => onToggleSelect(video.id)}
              className={`px-4 py-3 flex items-center gap-3.5 group cursor-pointer transition-all ${
                isSelected
                  ? 'bg-emerald-500/[0.04] hover:bg-emerald-500/[0.07]'
                  : 'hover:bg-zinc-900/40'
              }`}
            >
              {/* Checkbox */}
              <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onToggleSelect(video.id)}
                  className="p-1 rounded text-zinc-500 group-hover:text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4 text-zinc-600" />
                  )}
                </button>
              </div>

              {/* Video Thumbnail */}
              <div className="relative w-20 h-12 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800/80 shrink-0">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Play className="w-4 h-4 text-white fill-white/80" />
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-medium text-zinc-200 truncate group-hover:text-white transition-colors">
                    {video.title}
                  </h3>
                  <a
                    href={`https://studio.youtube.com/video/${video.id}/edit`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-emerald-400 transition-all shrink-0"
                    title="Open in YouTube Studio Editor"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-zinc-500 font-mono">
                  <span>{formatViewCount(video.viewCount)}</span>
                  <span>•</span>
                  <span>{formatDate(video.publishedAt)}</span>
                </div>
              </div>

              {/* Match Chip & Diff Inspector Button */}
              <div className="shrink-0 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {/* 5,000 char overflow warning */}
                {exceedsLimit && (
                  <span
                    className="px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[10px] font-mono flex items-center gap-1"
                    title={`New description will exceed YouTube's 5000 character limit by ${diff.limitOverflow} chars!`}
                  >
                    <AlertTriangle className="w-3 h-3" /> &gt;5K
                  </span>
                )}

                {/* Matches Badge */}
                {matchCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-medium shadow-glow-emerald">
                    {matchCount} {matchCount === 1 ? 'match' : 'matches'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-zinc-800/60 border border-zinc-700/40 text-zinc-500 text-[10px] font-mono">
                    0 matches
                  </span>
                )}

                {/* Inspect Diff Button */}
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => onInspectDiff(video)}
                  title="View Git-Style Description Diff"
                  className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors shadow-tactile"
                >
                  <Eye className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
