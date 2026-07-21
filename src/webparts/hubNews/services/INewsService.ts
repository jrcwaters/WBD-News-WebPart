import { INewsItem } from '../models/INewsItem';

/** Semantic news source that shapes which stories are rolled up. */
export type NewsSource = 'firmwide' | 'office' | 'practice' | 'custom';

export interface INewsQuery {
  /** Which roll-up to run. */
  source: NewsSource;
  /**
   * Audience / scope qualifier:
   *  - For 'office' / 'practice': an audience label (also used to match content in sample mode).
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
