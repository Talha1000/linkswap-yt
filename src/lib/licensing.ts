/**
 * LinkSwap YT - Licensing & Business Model Engine
 * Enforces 1-video free trial, Gumroad license verification, and Pro activation
 */

import { getStorageData, setStorageData } from './storage';

export interface LicenseState {
  isPro: boolean;
  freeTrialUsed: boolean;
  canExecuteTrial: boolean;
  licenseKey?: string;
  licenseDetails?: {
    productName?: string;
    email?: string;
    activatedAt?: string;
  };
}

export interface VerificationResult {
  success: boolean;
  message: string;
  isPro?: boolean;
  details?: {
    productName?: string;
    email?: string;
    uses?: number;
  };
}

// Gumroad product permalink or product ID
export const GUMROAD_PRODUCT_PERMALINK = 'linkswap-pro';
export const GUMROAD_PURCHASE_URL = 'https://gumroad.com/l/yourproduct';

/**
 * Retrieves the current user's license and trial entitlement status.
 */
export async function getLicenseState(): Promise<LicenseState> {
  const data = await getStorageData(['isPro', 'freeTrialUsed', 'licenseKey', 'licenseDetails']);
  const isPro = Boolean(data.isPro);
  const freeTrialUsed = Boolean(data.freeTrialUsed);

  return {
    isPro,
    freeTrialUsed,
    canExecuteTrial: isPro || !freeTrialUsed,
    licenseKey: data.licenseKey,
    licenseDetails: data.licenseDetails,
  };
}

/**
 * Marks the one-video free trial as exhausted and persists to sync storage.
 */
export async function markFreeTrialUsed(): Promise<void> {
  await setStorageData({ freeTrialUsed: true });
}

/**
 * Validates whether the user can swap links on the specified number of selected videos.
 * - Pro users: Unlimited videos
 * - Free users: Exactly 1 video if trial is unused; 0 if trial is used
 */
export async function canPerformBatchSwap(videoCount: number): Promise<{
  allowed: boolean;
  reason?: 'NEED_PRO_FOR_MULTI' | 'TRIAL_EXHAUSTED' | 'INVALID_COUNT';
  message?: string;
}> {
  if (videoCount <= 0) {
    return {
      allowed: false,
      reason: 'INVALID_COUNT',
      message: 'Please select at least 1 video to swap links.',
    };
  }

  const state = await getLicenseState();

  if (state.isPro) {
    return { allowed: true };
  }

  if (state.freeTrialUsed) {
    return {
      allowed: false,
      reason: 'TRIAL_EXHAUSTED',
      message: 'Your 1-video free trial has been used. Upgrade to LinkSwap Pro for unlimited batch swapping!',
    };
  }

  if (videoCount > 1) {
    return {
      allowed: false,
      reason: 'NEED_PRO_FOR_MULTI',
      message: 'The Free Trial is limited to 1 video. Upgrade to LinkSwap Pro to swap links across multiple videos simultaneously.',
    };
  }

  // Exactly 1 video and trial not used yet
  return { allowed: true };
}

/**
 * Verifies a license key against the Gumroad License API v2.
 * Also supports recognized developer/VIP test keys: "PRO-PREVIEW-2026", "LINKSWAP-VIP-LIFETIME"
 */
export async function verifyGumroadLicense(
  licenseKey: string,
  productPermalink: string = GUMROAD_PRODUCT_PERMALINK
): Promise<VerificationResult> {
  const trimmed = licenseKey.trim();

  if (!trimmed) {
    return {
      success: false,
      message: 'License key cannot be empty.',
    };
  }

  // Developer & QA bypass keys for local testing & demos
  const devKeys = ['LINKSWAP-PRO-DEMO', 'PRO-PREVIEW-2026', 'LINKSWAP-VIP-LIFETIME'];
  if (devKeys.includes(trimmed.toUpperCase())) {
    const details = {
      key: trimmed,
      productName: 'LinkSwap Pro — Unlimited Lifetime License',
      email: 'creator@youtube.studio',
      activatedAt: new Date().toISOString(),
    };

    await setStorageData({
      isPro: true,
      licenseKey: trimmed,
      licenseDetails: details,
    });

    return {
      success: true,
      isPro: true,
      message: 'VIP License Activated! Enjoy unlimited channel-wide link swapping.',
      details,
    };
  }

  try {
    const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        product_permalink: productPermalink,
        license_key: trimmed,
        increment_uses_count: 'true',
      }),
    });

    const data = await response.json();

    if (data.success && data.purchase) {
      if (data.purchase.refunded || data.purchase.chargebacked) {
        return {
          success: false,
          message: 'This license has been refunded or revoked.',
        };
      }

      const details = {
        key: trimmed,
        productName: data.purchase.product_name || 'LinkSwap Pro',
        email: data.purchase.email,
        activatedAt: new Date().toISOString(),
        uses: data.uses,
      };

      await setStorageData({
        isPro: true,
        licenseKey: trimmed,
        licenseDetails: details,
      });

      return {
        success: true,
        isPro: true,
        message: 'License key verified successfully! LinkSwap Pro unlocked.',
        details,
      };
    } else {
      return {
        success: false,
        message: data.message || 'Invalid or unrecognised license key. Please check your Gumroad receipt.',
      };
    }
  } catch (error) {
    console.error('Gumroad API verification error:', error);
    return {
      success: false,
      message: 'Network error connecting to Gumroad verification server. Please check your connection.',
    };
  }
}

/**
 * Deactivates or unlinks current license
 */
export async function deactivateLicense(): Promise<void> {
  await setStorageData({
    isPro: false,
    licenseKey: undefined,
    licenseDetails: undefined,
  });
}
