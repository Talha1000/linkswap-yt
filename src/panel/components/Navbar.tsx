import React from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Zap, 
  RefreshCw, 
  LogOut, 
  LogIn, 
  Activity,
  Layers,
  ArrowRightLeft
} from 'lucide-react';
import { YouTubeChannel } from '../../lib/youtube';
import { LicenseState } from '../../lib/licensing';

interface NavbarProps {
  channel: YouTubeChannel | null;
  license: LicenseState;
  quotaUsed: number;
  maxQuota: number;
  isLoading: boolean;
  onRefresh: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenPaywall: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  channel,
  license,
  quotaUsed,
  maxQuota,
  isLoading,
  onRefresh,
  onSignIn,
  onSignOut,
  onOpenPaywall,
}) => {
  const quotaPercent = Math.min(100, Math.round((quotaUsed / maxQuota) * 100));

  return (
    <header className="sticky top-0 z-30 w-full px-4 py-3 bg-obsidian/90 backdrop-blur-xl border-b border-zinc-800/80">
      <div className="flex items-center justify-between gap-3">
        {/* Brand & Workspace Name */}
        <div className="flex items-center gap-2.5">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-8 h-8 rounded-xl bg-zinc-900 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-glow-emerald"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-zinc-100">LinkSwap YT</span>
              {/* Pro / Free Pill */}
              {license.isPro ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onOpenPaywall}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-gradient-to-r from-amber-500/20 via-amber-400/20 to-amber-500/20 text-amber-300 border border-amber-500/40 shadow-glow-amber cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" /> PRO
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onOpenPaywall}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase cursor-pointer transition-all ${
                    license.freeTrialUsed
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-glow-emerald'
                  }`}
                  title={license.freeTrialUsed ? 'Free trial used. Click to upgrade.' : '1 video free trial available. Click to upgrade.'}
                >
                  {license.freeTrialUsed ? (
                    <span>Trial Used</span>
                  ) : (
                    <>
                      <Zap className="w-3 h-3 text-emerald-400" /> Free Trial
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* Right Section: Quota Meter & Channel Avatar */}
        <div className="flex items-center gap-2.5">
          {/* Quota Meter Tooltip / Pill */}
          <div 
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/60 border border-zinc-800 text-[11px] font-mono text-zinc-400"
            title={`API Daily Quota: ${quotaUsed.toLocaleString()} / ${maxQuota.toLocaleString()} units`}
          >
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>{quotaPercent}% Quota</span>
          </div>

          {/* Sync Refresh Button */}
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh channel videos"
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-zinc-100 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </motion.button>

          {/* Channel Avatar & Sign In/Out */}
          {channel ? (
            <div className="flex items-center gap-2 pl-1 border-l border-zinc-800">
              <div 
                className="flex items-center gap-2 group cursor-pointer"
                title={`${channel.title} (${channel.customUrl || channel.id})`}
              >
                <img
                  src={channel.avatarUrl}
                  alt={channel.title}
                  className="w-7 h-7 rounded-full border border-zinc-700 object-cover"
                />
                <span className="text-xs font-medium text-zinc-200 max-w-[100px] truncate hidden md:inline">
                  {channel.title}
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onSignOut}
                title="Disconnect Google Account"
                className="p-1.5 rounded-lg hover:bg-zinc-800/80 text-zinc-500 hover:text-rose-400 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          ) : (
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSignIn}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-zinc-950 font-semibold text-xs shadow-glow-emerald hover:bg-emerald-400 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Connect</span>
            </motion.button>
          )}
        </div>
      </div>
    </header>
  );
};
