import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ExternalLink, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  ShieldCheck, 
  ChevronRight,
  Zap,
  ArrowRightLeft
} from 'lucide-react';
import { getLicenseState, LicenseState } from '../lib/licensing';

export default function PopupApp() {
  const [license, setLicense] = useState<LicenseState>({
    isPro: false,
    freeTrialUsed: false,
    canExecuteTrial: true,
  });
  const [openingStudio, setOpeningStudio] = useState(false);
  const [openingPanel, setOpeningPanel] = useState(false);

  useEffect(() => {
    getLicenseState().then(setLicense);
  }, []);

  const handleOpenStudio = async () => {
    setOpeningStudio(true);
    try {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        // Look for existing studio tab
        const tabs = await chrome.tabs.query({ url: '*://studio.youtube.com/*' });
        if (tabs.length > 0 && tabs[0].id) {
          await chrome.tabs.update(tabs[0].id, { active: true });
          if (tabs[0].windowId) {
            await chrome.windows.update(tabs[0].windowId, { focused: true });
          }
        } else {
          await chrome.tabs.create({ url: 'https://studio.youtube.com' });
        }
      } else {
        window.open('https://studio.youtube.com', '_blank');
      }
    } catch (err) {
      console.error(err);
      window.open('https://studio.youtube.com', '_blank');
    } finally {
      setTimeout(() => setOpeningStudio(false), 800);
    }
  };

  const handleOpenSidePanel = async () => {
    setOpeningPanel(true);
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' }, () => {
          window.close(); // Close popup once panel is opened
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setOpeningPanel(false), 800);
    }
  };

  return (
    <div className="w-[360px] p-4 bg-obsidian text-zinc-100 flex flex-col gap-4 font-sans select-none relative overflow-hidden">
      {/* Dynamic Glow Ambient Highlights */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-emerald-500/30 flex items-center justify-center shadow-glow-emerald text-emerald-400">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-semibold tracking-tight text-zinc-100">LinkSwap YT</h1>
              <span className="text-[10px] text-zinc-500 font-mono">v1.0</span>
            </div>
            <p className="text-[11px] text-zinc-400">Tactile Affiliate Link Replacer</p>
          </div>
        </div>

        {/* License Pill */}
        {license.isPro ? (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-glow-amber">
            <Sparkles className="w-3 h-3" /> PRO
          </span>
        ) : license.freeTrialUsed ? (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
            Trial Exhausted
          </span>
        ) : (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <Zap className="w-3 h-3" /> 1 Free Swap
          </span>
        )}
      </div>

      {/* Feature Highlights Card */}
      <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-xl p-3 flex flex-col gap-2">
        <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          Tactile Engine Features
        </div>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/60 flex flex-col gap-0.5">
            <span className="text-[11px] text-zinc-400">Character Safety</span>
            <span className="text-xs font-mono font-medium text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> 5,000 Safe
            </span>
          </div>
          <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/60 flex flex-col gap-0.5">
            <span className="text-[11px] text-zinc-400">Diff Engine</span>
            <span className="text-xs font-mono font-medium text-zinc-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Git-Style
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2">
        {/* Open Side Panel */}
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          onClick={handleOpenSidePanel}
          disabled={openingPanel}
          className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 shadow-glow-emerald hover:bg-emerald-400 transition-colors"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Open Side Panel Workspace</span>
          <ChevronRight className="w-3.5 h-3.5 ml-auto text-zinc-900" />
        </motion.button>

        {/* 1-Click Launch YouTube Studio */}
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          onClick={handleOpenStudio}
          disabled={openingStudio}
          className="w-full py-2.5 px-3 rounded-xl bg-zinc-900/90 text-zinc-200 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/90 font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-tactile"
        >
          <ExternalLink className="w-3.5 h-3.5 text-red-500" />
          <span>Launch YouTube Studio</span>
          <ChevronRight className="w-3.5 h-3.5 ml-auto text-zinc-500" />
        </motion.button>
      </div>

      {/* Footer status notice */}
      <div className="text-[10px] text-center text-zinc-500 flex items-center justify-center gap-1.5 pt-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Ready in YouTube Studio sidebar & floating launcher
      </div>
    </div>
  );
}
