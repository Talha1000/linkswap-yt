import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Sparkles, 
  Check, 
  ExternalLink, 
  Key, 
  Loader2, 
  ShieldCheck, 
  Zap, 
  Lock,
  ArrowRight
} from 'lucide-react';
import { 
  verifyGumroadLicense, 
  GUMROAD_PURCHASE_URL, 
  LicenseState 
} from '../../lib/licensing';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLicenseActivated: () => void;
  reason?: 'NEED_PRO_FOR_MULTI' | 'TRIAL_EXHAUSTED' | 'GENERAL';
  currentLicense: LicenseState;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  onLicenseActivated,
  reason = 'GENERAL',
  currentLicense,
}) => {
  const [licenseInput, setLicenseInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseInput.trim()) return;

    setIsVerifying(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await verifyGumroadLicense(licenseInput);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          onLicenseActivated();
          onClose();
        }, 1200);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        {/* Backdrop click */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="relative w-full max-w-lg bg-obsidian-100 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden z-10 p-6 flex flex-col gap-6"
        >
          {/* Ambient Cyber Amber Top Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors z-20"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Badge & Title Header */}
          <div className="flex flex-col items-center text-center gap-2 pt-2">
            <motion.div
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-700/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-glow-amber mb-1"
            >
              <Sparkles className="w-6 h-6 fill-amber-400/20" />
            </motion.div>

            <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
              LinkSwap Pro
            </span>

            <h2 className="text-xl font-bold tracking-tight text-white mt-1">
              Unlimited Channel-Wide Swapping
            </h2>

            {/* Dynamic Reason Explainer */}
            <p className="text-xs text-zinc-400 max-w-md">
              {reason === 'NEED_PRO_FOR_MULTI' ? (
                <span className="text-amber-300 font-medium">
                  The Free Trial is strictly limited to 1 video. Upgrade to Pro to replace links across your entire library simultaneously.
                </span>
              ) : reason === 'TRIAL_EXHAUSTED' ? (
                <span className="text-amber-300 font-medium">
                  Your 1-video free trial has been used! Unlock unlimited lifetime batch swaps today.
                </span>
              ) : (
                'Save countless hours manually editing YouTube Studio descriptions. One click updates 100+ videos.'
              )}
            </p>
          </div>

          {/* Value Props Grid */}
          <div className="bg-zinc-950/60 rounded-xl border border-zinc-800/80 p-4 flex flex-col gap-2.5 text-xs text-zinc-300">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span><strong>Unlimited Videos:</strong> Batch replace 5, 50, or 500+ videos in seconds</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span><strong>Safety Shield:</strong> Automatic YouTube 5,000 character overflow protection</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span><strong>Visual Git Diff:</strong> Inspect live inline & split diffs before publishing</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span><strong>Single Lifetime Purchase:</strong> No recurring monthly subscriptions</span>
            </div>
          </div>

          {/* Purchase CTA Button */}
          <div className="flex flex-col gap-2">
            <motion.a
              href={GUMROAD_PURCHASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-zinc-950 font-bold text-sm shadow-glow-amber hover:brightness-110 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Upgrade to LinkSwap Pro — $19 Lifetime</span>
              <ExternalLink className="w-4 h-4 ml-1 stroke-[2.5]" />
            </motion.a>
            <p className="text-[11px] text-center text-zinc-500">
              Instant license delivery to your email via Gumroad.
            </p>
          </div>

          {/* License Key Activation Section */}
          <div className="pt-2 border-t border-zinc-800 flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Already have a license key?</span>
            </div>

            <form onSubmit={handleVerify} className="flex gap-2">
              <input
                type="text"
                value={licenseInput}
                onChange={(e) => setLicenseInput(e.target.value)}
                placeholder="XXXXXX-XXXXXX-XXXXXX"
                className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 font-mono tactile-input uppercase"
                disabled={isVerifying}
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isVerifying || !licenseInput.trim()}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xl text-xs font-medium border border-zinc-700 disabled:opacity-40 flex items-center gap-1.5 transition-colors"
              >
                {isVerifying ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                ) : (
                  <span>Activate</span>
                )}
              </motion.button>
            </form>

            {/* Error or Success notification */}
            {errorMsg && (
              <p className="text-xs text-rose-400 font-mono bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                {errorMsg}
              </p>
            )}
            {successMsg && (
              <p className="text-xs text-emerald-400 font-mono bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> {successMsg}
              </p>
            )}

            {/* Hint for demo/testing */}
            <p className="text-[10px] text-zinc-500 font-mono">
              Preview test key: <span className="text-zinc-400">PRO-PREVIEW-2026</span>
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
