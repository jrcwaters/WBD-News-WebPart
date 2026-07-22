/**
 * Colour tone for the category "pill" on a news card.
 * Maps 1:1 to the tag variants in the design spec:
 *   - default → soft-yellow pill  (news / general / social)
 *   - firm    → soft-blue pill    (firm-wide / operations / regulatory)
 *   - people  → soft-green pill   (people / team / early careers)
 *   - office  → soft-yellow pill  (office / facilities)  (visually same as default)
 */
export type NewsTone = 'default' | 'firm' | 'people' | 'office';

/**
 * A single normalised news story, independent of where it came from
 * (mock content or a live SharePoint Search roll-up).
 */
export interface INewsItem {
  /** Stable identifier (list item id, search doc id, or mock key). */
  id: string;
  /** Headline. */
  title: string;
  /** Short standfirst / summary. Shown in the Lead and Grid layouts. */
  summary?: string;
  /** Category label rendered inside the pill (e.g. "Firm-wide", "People"). */
  category?: string;
  /** Pill colour tone. Defaults to 'default' when omitted. */
  tone?: NewsTone;
  /** Author / source name, rendered bold in the byline. */
  author?: string;
  /** Byline meta after the author — date and optional reading time (e.g. "Today, 08:00 · 3 min read"). */
  meta?: string;
  /** Absolute or server-relative URL the card links to. */
  url?: string;
  /** Thumbnail image URL. When absent, a deterministic brand gradient is used instead. */
  imageUrl?: string;
}
