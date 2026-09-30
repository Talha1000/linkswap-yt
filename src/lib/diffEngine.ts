/**
 * LinkSwap YT - Diff Engine
 * High-performance string & regex replacement calculation,
 * YouTube 5,000 character limit validation, and git-style visual token diffing.
 */

export interface DiffResult {
  originalText: string;
  modifiedText: string;
  matchCount: number;
  originalLength: number;
  newLength: number;
  delta: number; // positive = increased chars, negative = decreased chars
  exceedsLimit: boolean; // YouTube description limit is 5000 chars
  limitOverflow: number;
  hasChanges: boolean;
  segments: DiffSegment[];
}

export type DiffSegmentType = 'unchanged' | 'removed' | 'added';

export interface DiffSegment {
  type: DiffSegmentType;
  text: string;
  lineNumber?: number;
}

export const YOUTUBE_DESCRIPTION_LIMIT = 5000;

/**
 * Escapes characters with special meaning in Regular Expressions
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Compiles a safe RegExp based on search terms and options
 */
export function createSearchRegex(
  searchQuery: string,
  options: { useRegex: boolean; caseSensitive: boolean }
): { regex: RegExp | null; error?: string } {
  if (!searchQuery) {
    return { regex: null };
  }

  const flags = options.caseSensitive ? 'g' : 'gi';

  if (!options.useRegex) {
    return {
      regex: new RegExp(escapeRegex(searchQuery), flags),
    };
  }

  try {
    return {
      regex: new RegExp(searchQuery, flags),
    };
  } catch (err: any) {
    return {
      regex: null,
      error: err.message || 'Invalid regular expression syntax',
    };
  }
}

/**
 * Computes the replacement and calculates metrics against YouTube's 5,000 char limit
 */
export function calculateDiff(
  originalDescription: string,
  searchQuery: string,
  replaceQuery: string,
  options: { useRegex: boolean; caseSensitive: boolean }
): DiffResult {
  const original = originalDescription || '';
  const originalLength = original.length;

  if (!searchQuery) {
    return {
      originalText: original,
      modifiedText: original,
      matchCount: 0,
      originalLength,
      newLength: originalLength,
      delta: 0,
      exceedsLimit: originalLength > YOUTUBE_DESCRIPTION_LIMIT,
      limitOverflow: Math.max(0, originalLength - YOUTUBE_DESCRIPTION_LIMIT),
      hasChanges: false,
      segments: [{ type: 'unchanged', text: original }],
    };
  }

  const { regex, error } = createSearchRegex(searchQuery, options);

  if (!regex || error) {
    return {
      originalText: original,
      modifiedText: original,
      matchCount: 0,
      originalLength,
      newLength: originalLength,
      delta: 0,
      exceedsLimit: originalLength > YOUTUBE_DESCRIPTION_LIMIT,
      limitOverflow: Math.max(0, originalLength - YOUTUBE_DESCRIPTION_LIMIT),
      hasChanges: false,
      segments: [{ type: 'unchanged', text: original }],
    };
  }

  // Count matches
  const matches = original.match(regex);
  const matchCount = matches ? matches.length : 0;

  if (matchCount === 0) {
    return {
      originalText: original,
      modifiedText: original,
      matchCount: 0,
      originalLength,
      newLength: originalLength,
      delta: 0,
      exceedsLimit: originalLength > YOUTUBE_DESCRIPTION_LIMIT,
      limitOverflow: Math.max(0, originalLength - YOUTUBE_DESCRIPTION_LIMIT),
      hasChanges: false,
      segments: [{ type: 'unchanged', text: original }],
    };
  }

  // Generate modified string
  const modifiedText = original.replace(regex, replaceQuery);
  const newLength = modifiedText.length;
  const delta = newLength - originalLength;
  const exceedsLimit = newLength > YOUTUBE_DESCRIPTION_LIMIT;
  const limitOverflow = Math.max(0, newLength - YOUTUBE_DESCRIPTION_LIMIT);

  // Generate visual diff segments
  const segments: DiffSegment[] = [];
  let lastIndex = 0;
  regex.lastIndex = 0; // reset stateful regex cursor

  let match: RegExpExecArray | null;
  while ((match = regex.exec(original)) !== null) {
    const matchIndex = match.index;
    const matchedText = match[0];

    // Push preceding unchanged chunk
    if (matchIndex > lastIndex) {
      segments.push({
        type: 'unchanged',
        text: original.slice(lastIndex, matchIndex),
      });
    }

    // Push removed token
    segments.push({
      type: 'removed',
      text: matchedText,
    });

    // Push added token if replacement is provided
    if (replaceQuery.length > 0) {
      segments.push({
        type: 'added',
        text: replaceQuery,
      });
    }

    lastIndex = matchIndex + matchedText.length;

    // Guard against zero-width infinite loops
    if (regex.lastIndex === matchIndex) {
      regex.lastIndex++;
    }
  }

  // Push remaining trail
  if (lastIndex < original.length) {
    segments.push({
      type: 'unchanged',
      text: original.slice(lastIndex),
    });
  }

  return {
    originalText: original,
    modifiedText,
    matchCount,
    originalLength,
    newLength,
    delta,
    exceedsLimit,
    limitOverflow,
    hasChanges: true,
    segments,
  };
}

/**
 * Splits text into lines for Git-style split diff comparisons
 */
export interface LineDiff {
  originalLineNumber?: number;
  newLineNumber?: number;
  originalText?: string;
  newText?: string;
  hasChange: boolean;
}

export function generateSideBySideDiff(
  original: string,
  modified: string,
  searchRegex: RegExp | null
): LineDiff[] {
  const origLines = original.split('\n');
  const modLines = modified.split('\n');
  const maxLines = Math.max(origLines.length, modLines.length);
  const diffs: LineDiff[] = [];

  for (let i = 0; i < maxLines; i++) {
    const origText = origLines[i];
    const modText = modLines[i];
    const hasChange = origText !== modText;

    diffs.push({
      originalLineNumber: origText !== undefined ? i + 1 : undefined,
      newLineNumber: modText !== undefined ? i + 1 : undefined,
      originalText: origText ?? '',
      newText: modText ?? '',
      hasChange,
    });
  }

  return diffs;
}
