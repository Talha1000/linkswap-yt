/**
 * LinkSwap YT - YouTube Data API v3 Client
 * Handles OAuth2 authentication via chrome.identity, channel discovery,
 * video snippet pagination, and rate-limited batch description updates.
 */

import { incrementApiQuota } from './storage';

export interface YouTubeChannel {
  id: string;
  title: string;
  customUrl?: string;
  avatarUrl: string;
  subscriberCount?: string;
  uploadsPlaylistId: string;
}

export interface YouTubeVideoItem {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnailUrl: string;
  viewCount?: string;
  categoryId?: string;
  tags?: string[];
  duration?: string;
}

export interface BatchUpdateProgress {
  currentIndex: number;
  total: number;
  currentVideoId: string;
  currentVideoTitle: string;
  status: 'pending' | 'updating' | 'success' | 'failed';
  error?: string;
  updatedVideos: string[];
  failedVideos: { id: string; title: string; error: string }[];
}

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Get OAuth2 authentication token from Chrome Identity API
 */
export async function getAuthToken(interactive: boolean = true): Promise<string> {
  if (typeof chrome === 'undefined' || !chrome.identity || !chrome.identity.getAuthToken) {
    throw new Error('Chrome Identity API is not available in this environment.');
  }

  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      if (!token) {
        return reject(new Error('Failed to retrieve OAuth token from Google Identity.'));
      }
      resolve(token);
    });
  });
}

/**
 * Revokes or clears the cached OAuth token (Sign out)
 */
export async function clearCachedToken(token: string): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.identity && chrome.identity.removeCachedAuthToken) {
    return new Promise((resolve) => {
      chrome.identity.removeCachedAuthToken({ token }, () => {
        resolve();
      });
    });
  }
}

/**
 * Generic authenticated fetch wrapper for YouTube Data API v3
 */
async function youtubeFetch<T>(
  endpoint: string,
  params: Record<string, string>,
  options: RequestInit = {},
  tokenOverride?: string
): Promise<T> {
  const token = tokenOverride || (await getAuthToken(true));
  const url = new URL(`${YOUTUBE_API_BASE}/${endpoint}`);

  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      url.searchParams.append(key, val);
    }
  });

  const res = await fetch(url.toString(), {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  await incrementApiQuota(1);

  if (!res.ok) {
    let errorDetail = `YouTube API Error ${res.status}: ${res.statusText}`;
    try {
      const errBody = await res.json();
      if (errBody?.error?.message) {
        errorDetail = errBody.error.message;
      }
    } catch {
      // ignore json parse errors
    }
    throw new Error(errorDetail);
  }

  return res.json() as Promise<T>;
}

/**
 * Fetches the authenticated user's YouTube channel details & uploads playlist ID
 */
export async function getChannelDetails(tokenOverride?: string): Promise<YouTubeChannel> {
  const data = await youtubeFetch<any>(
    'channels',
    {
      part: 'snippet,contentDetails,statistics',
      mine: 'true',
    },
    {},
    tokenOverride
  );

  if (!data.items || data.items.length === 0) {
    throw new Error('No YouTube channel associated with this Google Account was found.');
  }

  const channel = data.items[0];
  const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;

  if (!uploadsPlaylistId) {
    throw new Error('Channel uploads playlist could not be resolved.');
  }

  return {
    id: channel.id,
    title: channel.snippet?.title || 'Unknown Channel',
    customUrl: channel.snippet?.customUrl,
    avatarUrl: channel.snippet?.thumbnails?.default?.url || channel.snippet?.thumbnails?.medium?.url || '',
    subscriberCount: channel.statistics?.subscriberCount,
    uploadsPlaylistId,
  };
}

/**
 * Paginates videos from the uploads playlist (fetches up to maxResults, e.g. 50 items)
 */
export async function getChannelVideos(
  uploadsPlaylistId: string,
  maxResults: number = 50,
  pageToken?: string,
  tokenOverride?: string
): Promise<{ videos: YouTubeVideoItem[]; nextPageToken?: string; totalResults?: number }> {
  const playlistData = await youtubeFetch<any>(
    'playlistItems',
    {
      part: 'snippet,contentDetails',
      playlistId: uploadsPlaylistId,
      maxResults: String(Math.min(50, maxResults)),
      pageToken: pageToken || '',
    },
    {},
    tokenOverride
  );

  if (!playlistData.items || playlistData.items.length === 0) {
    return { videos: [] };
  }

  // Extract video IDs to query statistics (view count)
  const videoIds = playlistData.items
    .map((item: any) => item.contentDetails?.videoId || item.snippet?.resourceId?.videoId)
    .filter(Boolean);

  let viewCountMap: Record<string, string> = {};

  if (videoIds.length > 0) {
    try {
      const statsData = await youtubeFetch<any>(
        'videos',
        {
          part: 'statistics',
          id: videoIds.join(','),
        },
        {},
        tokenOverride
      );

      if (statsData.items) {
        statsData.items.forEach((item: any) => {
          viewCountMap[item.id] = item.statistics?.viewCount || '0';
        });
      }
    } catch (err) {
      console.warn('Could not fetch extra video statistics:', err);
    }
  }

  const videos: YouTubeVideoItem[] = playlistData.items.map((item: any) => {
    const videoId = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId || item.id;
    const thumbs = item.snippet?.thumbnails;
    const thumbnailUrl =
      thumbs?.medium?.url || thumbs?.high?.url || thumbs?.default?.url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&q=80';

    return {
      id: videoId,
      title: item.snippet?.title || 'Untitled Video',
      description: item.snippet?.description || '',
      publishedAt: item.snippet?.publishedAt || '',
      thumbnailUrl,
      viewCount: viewCountMap[videoId] || '0',
    };
  });

  return {
    videos,
    nextPageToken: playlistData.nextPageToken,
    totalResults: playlistData.pageInfo?.totalResults,
  };
}

/**
 * Updates a single video's description via videos.update
 */
export async function updateVideoDescription(
  videoId: string,
  newDescription: string,
  tokenOverride?: string
): Promise<any> {
  const token = tokenOverride || (await getAuthToken(true));

  // 1. Get current video snippet to preserve categoryId and title
  const currentVideoData = await youtubeFetch<any>(
    'videos',
    {
      part: 'snippet',
      id: videoId,
    },
    {},
    token
  );

  if (!currentVideoData.items || currentVideoData.items.length === 0) {
    throw new Error(`Video ID ${videoId} not found.`);
  }

  const currentSnippet = currentVideoData.items[0].snippet;

  // 2. Execute update
  const payload = {
    id: videoId,
    snippet: {
      title: currentSnippet.title,
      categoryId: currentSnippet.categoryId,
      description: newDescription,
      tags: currentSnippet.tags,
      defaultLanguage: currentSnippet.defaultLanguage,
    },
  };

  const updateRes = await fetch(`${YOUTUBE_API_BASE}/videos?part=snippet`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  await incrementApiQuota(50); // videos.update costs ~50 quota units

  if (!updateRes.ok) {
    const err = await updateRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to update video ${videoId}: status ${updateRes.status}`);
  }

  return updateRes.json();
}

/**
 * Helper delay function
 */
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes batch video description updates with a safety backoff interval (250ms spacing)
 */
export async function executeBatchUpdate(
  items: { videoId: string; title: string; newDescription: string }[],
  onProgress: (progress: BatchUpdateProgress) => void,
  tokenOverride?: string
): Promise<BatchUpdateProgress> {
  const progress: BatchUpdateProgress = {
    currentIndex: 0,
    total: items.length,
    currentVideoId: '',
    currentVideoTitle: '',
    status: 'updating',
    updatedVideos: [],
    failedVideos: [],
  };

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    progress.currentIndex = i + 1;
    progress.currentVideoId = item.videoId;
    progress.currentVideoTitle = item.title;
    onProgress({ ...progress });

    try {
      await updateVideoDescription(item.videoId, item.newDescription, tokenOverride);
      progress.updatedVideos.push(item.videoId);
    } catch (err: any) {
      console.error(`Failed to update video ${item.videoId}:`, err);
      progress.failedVideos.push({
        id: item.videoId,
        title: item.title,
        error: err.message || 'Unknown error during description update',
      });
    }

    onProgress({ ...progress });

    // Safety rate limit backoff (250ms spacing between YouTube updates)
    if (i < items.length - 1) {
      await delay(250);
    }
  }

  progress.status = progress.failedVideos.length === 0 ? 'success' : 'failed';
  onProgress({ ...progress });
  return progress;
}

/**
 * Realistic Mock Data for Immediate Development & Testing
 * (Allows seamless preview if Google OAuth Client ID has not yet been registered)
 */
export const MOCK_CHANNEL: YouTubeChannel = {
  id: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
  title: 'Apex Tech Lab',
  customUrl: '@ApexTechLab',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&q=80',
  subscriberCount: '184000',
  uploadsPlaylistId: 'UU_x5XG1OV2P6uZZ5FSM9Ttw',
};

export const MOCK_VIDEOS: YouTubeVideoItem[] = [
  {
    id: 'vid_01',
    title: 'Top 10 Mechanical Keyboards for Software Engineers (2026)',
    publishedAt: '2026-09-12T14:00:00Z',
    thumbnailUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=320&q=80',
    viewCount: '142850',
    description: `Here are my top recommendations for mechanical keyboards this year!
    
🔥 Check out my custom daily driver:
https://amzn.to/old-sponsor-link-v1

Sponsored by MechanicalKey Co — use code APEX10 for 10% off:
https://partner.affiliate-hub.com/deal?ref=apex2025

Follow my social handles:
Twitter: https://x.com/ApexTechLab
Discord: https://discord.gg/apextech`,
  },
  {
    id: 'vid_02',
    title: 'Ultrawide OLED vs Dual 4K Studio Displays — Real Desk Setup',
    publishedAt: '2026-08-28T18:30:00Z',
    thumbnailUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=320&q=80',
    viewCount: '98400',
    description: `Comparing the latest 49" OLED with dual Studio Displays.
    
Gear featured in this video:
Monitor Arm & Cable Hub: https://partner.affiliate-hub.com/deal?ref=apex2025
Desk Mat: https://amzn.to/old-sponsor-link-v1

Don't forget to like and subscribe for more developer desk setups!`,
  },
  {
    id: 'vid_03',
    title: 'How I Built a Luxury SaaS Micro-Product in 48 Hours',
    publishedAt: '2026-08-15T11:00:00Z',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=320&q=80',
    viewCount: '312900',
    description: `Behind the scenes building and launching a profitable web tool with AI pair programming.
    
Deploy with fast global edge:
https://partner.affiliate-hub.com/deal?ref=apex2025

Special sponsor link:
https://brand-sponsor.io/r/apex-autumn

Get the source code template on GitHub.`,
  },
  {
    id: 'vid_04',
    title: 'M4 Max MacBook Pro Developer Review: 6 Months Later',
    publishedAt: '2026-07-20T16:45:00Z',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=320&q=80',
    viewCount: '450200',
    description: `Is 64GB Unified Memory worth it for local LLMs and heavy virtualization?
    
Check current prices:
https://amzn.to/old-sponsor-link-v1

Back up your code with Backblaze (Get 1 month free):
https://partner.affiliate-hub.com/deal?ref=apex2025`,
  },
  {
    id: 'vid_05',
    title: 'The Ultimate Minimalist Dev Environment (Zsh, Neovim, Ghostty)',
    publishedAt: '2026-06-30T10:15:00Z',
    thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=320&q=80',
    viewCount: '215000',
    description: `Full dotfiles walkthrough and workflow optimization.
    
Terminal font download: https://github.com/dotfiles
Sponsor: https://partner.affiliate-hub.com/deal?ref=apex2025`,
  },
];
