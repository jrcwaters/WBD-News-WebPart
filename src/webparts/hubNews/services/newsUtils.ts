import { NewsTone } from '../models/INewsItem';

// Note: relative-date formatting (formatRelativeDate) now lives in the shared
// @wbd/hub-core library and is imported directly where needed. Only the
// News-specific presentation helpers remain here.

/** Number of brand gradient fallbacks available (g1…g5 in the stylesheet). */
export const GRADIENT_COUNT: number = 5;

/**
 * Deterministically pick a gradient index (1…GRADIENT_COUNT) from a seed string,
 * so a given story always falls back to the same thumbnail gradient.
 */
export function gradientIndex(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return (Math.abs(hash) % GRADIENT_COUNT) + 1;
}

/**
 * Best-effort mapping of a free-text category/site name to a pill tone,
 * used when live content has no explicit tone. Falls back to 'default'.
 */
export function toneFromCategory(category: string | undefined): NewsTone {
  if (!category) {
    return 'default';
  }
  const c = category.toLowerCase();
  if (/(people|team|welcome|joiner|early career|hr|associate)/.test(c)) {
    return 'people';
  }
  if (/(firm|operation|regulat|governance|compliance|training|knowledge|policy)/.test(c)) {
    return 'firm';
  }
  if (/(office|facilit|building|estate)/.test(c)) {
    return 'office';
  }
  return 'default';
}
