import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  GitCompare, 
  Columns, 
  AlignLeft, 
  Copy, 
  Check, 
  AlertTriangle, 
  ShieldCheck, 
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { YouTubeVideoItem } from '../../lib/youtube';
import { DiffResult, generateSideBySideDiff, YOUTUBE_DESCRIPTION_LIMIT } from '../../lib/diffEngine';

interface DiffPreviewProps {
  isOpen: boolean;
  video: YouTubeVideoItem | null;
  diff: DiffResult | null;
  onClose: () => void;
  onApplySingle?: (video: YouTubeVideoItem, newDescription: string) => void;
}

export const DiffPreview: React.FC<DiffPreviewProps> = ({
  isOpen,
  video,
  diff,
  onClose,
  onApplySingle,
}) => {
  const [viewMode, setViewMode] = useState<'inline' | 'split'>('inline');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !video || !diff) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(diff.modifiedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sideBySide = generateSideBySideDiff(diff.originalText, diff.modifiedText, null);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        {/* Backdrop click */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-obsidian-100 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="px-5 py-4 bg-obsidian-200/90 border-b border-zinc-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-glow-emerald">
                <GitCompare className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-zinc-100 truncate">
                    Git Diff Preview
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                    {diff.matchCount} {diff.matchCount === 1 ? 'replacement' : 'replacements'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 truncate max-w-lg mt-0.5">
                  {video.title}
                </p>
              </div>
            </div>

            {/* Right Controls: View Switcher & Close */}
            <div className="flex items-center gap-2">
              <div className="flex items-center p-0.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <button
                  onClick={() => setViewMode('inline')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    viewMode === 'inline'
                      ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Unified Inline Token Diff"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Inline</span>
                </button>
                <button
                  onClick={() => setViewMode('split')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    viewMode === 'split'
                      ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Side-by-Side Split Diff"
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Split</span>
                </button>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {/* Metric Bar: 5,000 Char Threshold & Delta */}
          <div className="px-5 py-2.5 bg-zinc-900/40 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            <div className="flex items-center gap-4">
              <span className="text-zinc-400">
                Original: <strong className="text-zinc-200">{diff.originalLength.toLocaleString()}</strong> chars
              </span>
              <ArrowRight className="w-3 h-3 text-zinc-600" />
              <span className="text-zinc-400">
                New: <strong className={diff.exceedsLimit ? 'text-rose-400 font-bold' : 'text-zinc-200'}>
                  {diff.newLength.toLocaleString()}
                </strong> / {YOUTUBE_DESCRIPTION_LIMIT.toLocaleString()} chars
              </span>
              {/* Delta Chip */}
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                  diff.delta > 0
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : diff.delta < 0
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}
              >
                {diff.delta > 0 ? `+${diff.delta}` : diff.delta} chars Δ
              </span>
            </div>

            {/* Threshold Safety Status */}
            <div>
              {diff.exceedsLimit ? (
                <span className="flex items-center gap-1.5 text-rose-400 font-semibold bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Exceeds limit by {diff.limitOverflow} characters!
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Within YouTube 5,000 Char Limit
                </span>
              )}
            </div>
          </div>

          {/* Diff Content Body */}
          <div className="flex-1 overflow-y-auto p-5 font-mono text-xs leading-relaxed select-text bg-[#070809]">
            {viewMode === 'inline' ? (
              /* Inline Unified Token Diff */
              <div className="whitespace-pre-wrap break-words bg-zinc-950/70 p-4 rounded-xl border border-zinc-800/80">
                {diff.segments.map((segment, idx) => {
                  if (segment.type === 'removed') {
                    return (
                      <span
                        key={idx}
                        className="bg-rose-500/20 text-rose-300 line-through decoration-rose-500/80 px-1 py-0.5 rounded mx-0.5 border border-rose-500/30"
                      >
                        {segment.text}
                      </span>
                    );
                  }
                  if (segment.type === 'added') {
                    return (
                      <span
                        key={idx}
                        className="bg-emerald-500/20 text-emerald-300 px-1 py-0.5 rounded mx-0.5 border border-emerald-500/40 shadow-glow-emerald font-semibold"
                      >
                        {segment.text}
                      </span>
                    );
                  }
                  return <span key={idx} className="text-zinc-300">{segment.text}</span>;
                })}
              </div>
            ) : (
              /* Split Side-by-Side View */
              <div className="grid grid-cols-2 gap-3">
                {/* Left: Original */}
                <div className="flex flex-col rounded-xl border border-zinc-800/80 overflow-hidden bg-zinc-950/70">
                  <div className="px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-[11px] font-semibold text-rose-400">
                    Original Description
                  </div>
                  <div className="p-3 overflow-x-auto whitespace-pre-wrap break-words text-zinc-300 divide-y divide-zinc-900">
                    {sideBySide.map((line, idx) => (
                      <div
                        key={idx}
                        className={`py-0.5 ${
                          line.hasChange ? 'bg-rose-500/10 text-rose-300' : 'text-zinc-400'
                        }`}
                      >
                        <span className="inline-block w-8 text-zinc-600 select-none text-[10px]">
                          {line.originalLineNumber || ''}
                        </span>
                        {line.originalText}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Modified */}
                <div className="flex flex-col rounded-xl border border-zinc-800/80 overflow-hidden bg-zinc-950/70">
                  <div className="px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-[11px] font-semibold text-emerald-400">
                    Proposed Replacement
                  </div>
                  <div className="p-3 overflow-x-auto whitespace-pre-wrap break-words text-zinc-200 divide-y divide-zinc-900">
                    {sideBySide.map((line, idx) => (
                      <div
                        key={idx}
                        className={`py-0.5 ${
                          line.hasChange ? 'bg-emerald-500/10 text-emerald-300 font-medium' : 'text-zinc-300'
                        }`}
                      >
                        <span className="inline-block w-8 text-zinc-600 select-none text-[10px]">
                          {line.newLineNumber || ''}
                        </span>
                        {line.newText}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-5 py-3.5 bg-obsidian-200/90 border-t border-zinc-800 flex items-center justify-between gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-zinc-100 text-xs font-medium transition-all shadow-tactile"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Modified Text</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-zinc-100 text-xs font-medium"
              >
                Close Preview
              </motion.button>

              {onApplySingle && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={diff.exceedsLimit}
                  onClick={() => onApplySingle(video, diff.modifiedText)}
                  className="px-4 py-1.5 rounded-xl bg-emerald-500 text-zinc-950 font-semibold text-xs shadow-glow-emerald hover:bg-emerald-400 disabled:opacity-40 disabled:pointer-events-none transition-all"
                >
                  Apply to this Video
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
