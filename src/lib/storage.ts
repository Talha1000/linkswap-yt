/**
 * LinkSwap YT - Type-Safe Storage Adapter
 * Wraps chrome.storage.sync and chrome.storage.local with fallbacks and reactivity
 */

export interface StorageData {
  isPro: boolean;
  freeTrialUsed: boolean;
  licenseKey?: string;
  licenseDetails?: {
    key: string;
    productName?: string;
    email?: string;
    activatedAt?: string;
  };
  channelInfo?: {
    id: string;
    title: string;
    avatarUrl: string;
    customUrl?: string;
    subscriberCount?: string;
  };
  preferences?: {
    caseSensitive: boolean;
    useRegex: boolean;
    searchScope: 'descriptions' | 'all';
  };
  apiQuota?: {
    date: string;
    unitsUsed: number;
    maxUnits: number;
  };
}

const DEFAULT_STORAGE: StorageData = {
  isPro: false,
  freeTrialUsed: false,
  preferences: {
    caseSensitive: false,
    useRegex: false,
    searchScope: 'descriptions',
  },
  apiQuota: {
    date: new Date().toISOString().split('T')[0],
    unitsUsed: 0,
    maxUnits: 10000,
  }
};

const isChromeStorageAvailable = (): boolean => {
  return typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.sync;
};

export async function getStorageData<K extends keyof StorageData>(keys?: K[]): Promise<StorageData> {
  if (isChromeStorageAvailable()) {
    try {
      const result = await chrome.storage.sync.get(keys || null);
      return {
        ...DEFAULT_STORAGE,
        ...result,
      } as StorageData;
    } catch (err) {
      console.warn('Error reading chrome.storage.sync, falling back to local storage', err);
    }
  }

  // Fallback for dev / mock testing in standard browser environment
  try {
    const raw = localStorage.getItem('linkswap_storage');
    if (raw) {
      return { ...DEFAULT_STORAGE, ...JSON.parse(raw) };
    }
  } catch {
    // localStorage might be unavailable
  }

  return DEFAULT_STORAGE;
}

export async function setStorageData(partial: Partial<StorageData>): Promise<void> {
  if (isChromeStorageAvailable()) {
    try {
      await chrome.storage.sync.set(partial);
      return;
    } catch (err) {
      console.warn('Error setting chrome.storage.sync, falling back', err);
    }
  }

  try {
    const current = await getStorageData();
    const updated = { ...current, ...partial };
    localStorage.setItem('linkswap_storage', JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to write to localStorage fallback', err);
  }
}

export async function resetFreeTrialForTesting(): Promise<void> {
  await setStorageData({ freeTrialUsed: false, isPro: false, licenseKey: undefined });
}

export async function incrementApiQuota(units: number = 1): Promise<number> {
  const current = await getStorageData(['apiQuota']);
  const today = new Date().toISOString().split('T')[0];
  let quota = current.apiQuota || DEFAULT_STORAGE.apiQuota!;

  if (quota.date !== today) {
    quota = { date: today, unitsUsed: 0, maxUnits: 10000 };
  }

  quota.unitsUsed += units;
  await setStorageData({ apiQuota: quota });
  return quota.unitsUsed;
}
