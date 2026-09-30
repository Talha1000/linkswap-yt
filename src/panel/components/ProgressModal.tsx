import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { BatchUpdateProgress } from '../../lib/youtube';

interface ProgressModalProps {
  isOpen: boolean;
  progress: BatchUpdateProgress | null;
  onClose: () => void;
}

export const ProgressModal: React.FC<ProgressModalProps> = ({
  isOpen,
  progress,
  onClose,
}) => {
  if (!isOpen || !progress) return null;

  const percentage = progress.total > 0 
    ? Math.min(100, Math.round((progress.currentIndex / progress.total) * 100))
    : 0;

  const isCompleted = progress.status === 'success' || (progress.status === 'failed' && progress.currentIndex >= progress.total);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="relative w-full max-w-lg bg-obsidian-100 border border-zinc-800 rounded-2xl shadow-2xl p-6 flex flex-col gap-5 overflow-hidden"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-glow-emerald">
                {isCompleted ? (
                  progress.failedVideos.length === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  )
                ) : (
                  <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  {isCompleted ? 'Batch Replacement Complete' : 'Executing Batch Swap...'}
                </h3>
                <p className="text-xs text-zinc-400">
                  {isCompleted
                    ? `Processed ${progress.total} video descriptions`
                    : `Updating video ${progress.currentIndex} of ${progress.total}`}
                </p>
              </div>
            </div>

            <span className="text-lg font-mono font-bold text-emerald-400">
              {percentage}%
            </span>
          </div>

          {/* Live Progress Bar with Animated Striping */}
          <div className="flex flex-col gap-1.5">
            <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/80 p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-300 rounded-full animated-stripes shadow-glow-emerald"
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-zinc-500 px-0.5">
              <span>Rate safe: 250ms spacing</span>
              <span>{progress.currentIndex} / {progress.total}</span>
            </div>
          </div>

          {/* Current Target Video Card */}
          {!isCompleted && progress.currentVideoTitle && (
            <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/70 flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Writing to YouTube Data API v3:
              </span>
              <p className="text-xs text-zinc-200 truncate font-medium">
                {progress.currentVideoTitle}
              </p>
            </div>
          )}

          {/* Completion Summary */}
          {isCompleted && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl flex flex-col gap-1">
                  <span className="text-xs text-zinc-400">Successfully Swapped</span>
                  <span className="text-lg font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> {progress.updatedVideos.length}
                  </span>
                </div>
                <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl flex flex-col gap-1">
                  <span className="text-xs text-zinc-400">Failed / Skipped</span>
                  <span className={`text-lg font-mono font-bold flex items-center gap-1.5 ${
                    progress.failedVideos.length > 0 ? 'text-rose-400' : 'text-zinc-500'
                  }`}>
                    {progress.failedVideos.length > 0 ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                    {progress.failedVideos.length}
                  </span>
                </div>
              </div>

              {/* Failures list if any */}
              {progress.failedVideos.length > 0 && (
                <div className="max-h-32 overflow-y-auto p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-mono text-rose-300 flex flex-col gap-1.5">
                  <span className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Errors encountered:
                  </span>
                  {progress.failedVideos.map((fail, i) => (
                    <div key={i} className="text-[11px] truncate">
                      • {fail.title}: {fail.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action button */}
          {isCompleted && (
            <div className="pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 text-zinc-950 font-semibold text-xs shadow-glow-emerald hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Return to Workspace</span>
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
