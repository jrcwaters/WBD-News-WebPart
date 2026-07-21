import { INewsService, NewsSource } from '../services/INewsService';

/** The three layout modes from the design spec. */
export type NewsLayout = 'lead' | 'grid' | 'compact';

export interface IHubNewsProps {
  /** Heading shown next to the yellow accent bar. */
  title: string;
  /** Which layout to render. */
  layout: NewsLayout;
  /** Semantic news source (drives the roll-up / sample set). */
  source: NewsSource;
  /** Audience / scope qualifier. */
  audience: string;
  /** How many stories to show. */
  itemCount: number;
  /** "See all" link caption (hidden when empty). */
  seeAllText: string;
  /** "See all" link target (rendered as plain text when empty). */
  seeAllUrl: string;
  /** Resolved data provider (mock or SharePoint). */
  service: INewsService;
  /** Primitive that changes when the provider changes, so the fetch effect re-runs. */
  dataMode: 'sample' | 'sharepoint';
}
