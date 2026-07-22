import { NewsTone } from '../models/INewsItem';

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

/**
 * Human-friendly relative date used in the byline:
 * "Today", "Yesterday", a weekday name for the last week, otherwise a short date.
 */
export function formatRelativeDate(input: Date | string | undefined): string {
  if (!input) {
    return '';
  }
  const date = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(date.getTime())) {
    return '';
  }

  const startOfDay = (d: Date): number =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  const oneDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(date)) / oneDay);

  if (diffDays <= 0) {
    return 'Today';
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return date.toLocaleDateString(undefined, { weekday: 'long' });
  }
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
