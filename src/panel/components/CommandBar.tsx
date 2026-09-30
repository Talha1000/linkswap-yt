import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ArrowRight, 
  Regex, 
  CaseSensitive, 
  X, 
  Eye, 
  Zap, 
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface CommandBarProps {
  searchQuery: string;
  replaceQuery: string;
  useRegex: boolean;
  caseSensitive: boolean;
  totalMatches: number;
  matchingVideosCount: number;
  selectedCount: number;
  onSearchChange: (val: string) => void;
  onReplaceChange: (val: string) => void;
  onToggleRegex: () => void;
  onToggleCaseSensitive: () => void;
  onOpenPreview: () => void;
  onTriggerSwap: () => void;
  isPro: boolean;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  searchQuery,
  replaceQuery,
  useRegex,
  caseSensitive,
  totalMatches,
  matchingVideosCount,
  selectedCount,
  onSearchChange,
  onReplaceChange,
  onToggleRegex,
  onToggleCaseSensitive,
  onOpenPreview,
  onTriggerSwap,
  isPro,
}) => {
  const [regexError, setRegexError] = useState<string | null>(null);

  // Validate regex syntax when typing
  const handleSearchInput = (val: string) => {
    onSearchChange(val);
    if (useRegex && val) {
      try {
        new RegExp(val);
        setRegexError(null);
      } catch (err: any) {
        setRegexError(err.message || 'Invalid regex');
      }
    } else {
      setRegexError(null);
    }
  };

  return (
    <div className="w-full p-4 bg-obsidian-100/90 border-b border-zinc-800/80 backdrop-blur-xl flex flex-col gap-3 shadow-tactile">
      {/* Primary Find & Replace Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
        {/* Find Input */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-emerald-400 transition-colors">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder="Find affiliate link or sponsor URL (e.g. amzn.to/...)"
            className="w-full pl-9 pr-24 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 font-mono tactile-input shadow-inner"
          />
          {/* Quick Clear & Matches Chip */}
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1.5">
            {searchQuery && (
              <button
                onClick={() => handleSearchInput('')}
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                title="Clear find query"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <span 
              className={`text-[10px] font-mono px-2 py-0.5 rounded-md border transition-all ${
                totalMatches > 0
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-zinc-800/80 text-zinc-500 border-zinc-700/60'
              }`}
            >
              {totalMatches} {totalMatches === 1 ? 'match' : 'matches'}
            </span>
          </div>
        </div>

        {/* Replace Input */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-emerald-400 transition-colors">
            <ArrowRight className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={replaceQuery}
            onChange={(e) => onReplaceChange(e.target.value)}
            placeholder="Replace with new target URL or campaign tracking tag..."
            className="w-full pl-9 pr-9 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 font-mono tactile-input shadow-inner"
          />
          {replaceQuery && (
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
              <button
                onClick={() => onReplaceChange('')}
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                title="Clear replace query"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Regex Syntax Warning if any */}
      {regexError && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Regex Syntax Error: {regexError}</span>
        </div>
      )}

      {/* Control Strip: Toggles, Presets, and Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        {/* Left: Toggles & Quick Presets */}
        <div className="flex items-center gap-2">
          {/* Regex Toggle */}
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleRegex}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              useRegex
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-glow-emerald'
                : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
            }`}
            title="Toggle Regular Expression (Regex) matching"
          >
            <Regex className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px]">Regex</span>
          </motion.button>

          {/* Case Sensitive Toggle */}
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleCaseSensitive}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              caseSensitive
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-glow-emerald'
                : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
            }`}
            title="Toggle Case Sensitivity"
          >
            <CaseSensitive className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px]">Match Case</span>
          </motion.button>

          {/* Info Badge */}
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-zinc-500 pl-2">
            <span>{matchingVideosCount} matching {matchingVideosCount === 1 ? 'video' : 'videos'}</span>
          </div>
        </div>

        {/* Right: Preview & Execution Buttons */}
        <div className="flex items-center gap-2">
          {/* Visual Diff Preview Button */}
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            onClick={onOpenPreview}
            disabled={!searchQuery || totalMatches === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:border-zinc-700 text-xs font-medium disabled:opacity-40 disabled:pointer-events-none transition-all shadow-tactile"
          >
            <Eye className="w-3.5 h-3.5 text-zinc-400" />
            <span>Diff Preview</span>
          </motion.button>

          {/* Batch Swap Trigger Button */}
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            onClick={onTriggerSwap}
            disabled={!searchQuery || selectedCount === 0 || totalMatches === 0}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-zinc-950 text-xs font-semibold shadow-glow-emerald hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>
              Swap Links ({selectedCount} {selectedCount === 1 ? 'video' : 'videos'})
            </span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};
