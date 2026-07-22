import { INewsItem } from '../models/INewsItem';

/**
 * News source that shapes which stories are rolled up:
 *  - 'all'    → the firm's news sites, merged.
 *  - 'growth' → the "Growth @ WBD" feed (/sites/SPIN_OurStrategy).
 *  - 'you'    → the "You & WBD" feed (/sites/SPIN_News).
 *  - 'picker' → a site chosen with the property-pane site search (URL in `audience`).
 *  - 'custom' → a site URL typed into `audience`.
 */
export type NewsSource = 'all' | 'growth' | 'you' | 'picker' | 'custom';

export interface INewsQuery {
  /** Which roll-up to run. */
  source: NewsSource;
  /**
   * Scope qualifier. Ignored for the named site feeds ('growth' / 'you').
   *  - For 'all': an optional extra filter — a site URL (Path) or a search term.
   *  - For 'custom': a site URL (adds a Path filter) or a raw KQL fragment.
   */
  audience?: string;
  /** Maximum number of stories to return. */
  count: number;
}

/**
 * Abstraction over a news provider. Implemented by {@link MockNewsService}
 * (built-in sample content) and {@link SharePointNewsService} (live Search roll-up).
 */
export interface INewsService {
  getNews(query: INewsQuery): Promise<INewsItem[]>;
}
