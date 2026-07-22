import { WebPartContext } from '@microsoft/sp-webpart-base';
import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import { INewsItem } from '../models/INewsItem';
import { INewsService, INewsQuery } from './INewsService';
import { formatRelativeDate } from './newsUtils';

interface IListItem {
  Title?: string;
  FileRef?: string;
  Description?: string;
  BannerImageUrl?: { Url?: string };
  FirstPublishedDate?: string;
  Created?: string;
  Modified?: string;
  Author?: { Title?: string };
}
interface IListResponse {
  value?: IListItem[];
}
interface IDatedItem {
  item: INewsItem;
  date: number;
}

/** Server-relative paths for the named site feeds. */
const SITE_PATHS: { [source: string]: string } = {
  growth: '/sites/SPIN_OurStrategy', // "Growth @ WBD"
  you: '/sites/SPIN_News' // "You & WBD"
};

/** News posts are Site Pages with PromotedState = 2. */
const ITEM_QUERY: string =
  "$select=Title,FileRef,Description,BannerImageUrl,FirstPublishedDate,Created,Modified,Author/Title" +
  '&$expand=Author&$filter=PromotedState eq 2&$orderby=FirstPublishedDate desc';

/**
 * Pulls modern SharePoint News posts (`PromotedState = 2`) directly from each site's
 * "Site Pages" library via the list REST API. This deliberately avoids the Search
 * service, whose query endpoints proved unreliable on this tenant (the GET endpoint
 * URL-encodes the querytext quotes; the POST endpoint 500s). The list API is a plain,
 * dependable call.
 *
 * Named feeds query their own site; "All news" merges the firm's news sites. A failure
 * on any one site is skipped so an unreachable site can't blank the whole web part.
 */
export class SharePointNewsService implements INewsService {
  constructor(private readonly context: WebPartContext) {}

  public async getNews(query: INewsQuery): Promise<INewsItem[]> {
    const top = Math.max(1, query.count || 5);
    const sites = this._targetSites(query);

    const perSite = await Promise.all(
      sites.map((site) => this._getSiteNews(site, top).catch(() => [] as IDatedItem[]))
    );

    const merged: IDatedItem[] = [];
    for (const list of perSite) {
      for (const entry of list) {
        merged.push(entry);
      }
    }
    merged.sort((a, b) => b.date - a.date); // newest first
    return merged.slice(0, top).map((entry) => entry.item);
  }

  /** Resolves which site collection(s) to read News from for a given query. */
  private _targetSites(query: INewsQuery): string[] {
    const origin = this._origin();

    if (query.source === 'growth' || query.source === 'you') {
      return [origin + SITE_PATHS[query.source]];
    }

    if (query.source === 'custom' || query.source === 'picker') {
      // 'custom' = a URL typed in; 'picker' = a URL chosen via the site search.
      const audience = (query.audience || '').trim();
      if (audience) {
        const site = /^https?:\/\//i.test(audience)
          ? audience.replace(/\/+$/, '')
          : `${origin}/${audience.replace(/^\/+|\/+$/g, '')}`;
        return [site];
      }
      return [this.context.pageContext.web.absoluteUrl.replace(/\/+$/, '')];
    }

    // 'all' — the firm's news sites.
    return [origin + SITE_PATHS.growth, origin + SITE_PATHS.you];
  }

  private async _getSiteNews(siteUrl: string, top: number): Promise<IDatedItem[]> {
    const endpoint = `${siteUrl}/_api/web/lists/GetByTitle('Site Pages')/items?${ITEM_QUERY}&$top=${top}`;

    const response: SPHttpClientResponse = await this.context.spHttpClient.get(
      endpoint,
      SPHttpClient.configurations.v1,
      { headers: { Accept: 'application/json;odata=nometadata' } }
    );

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error(
        `[Hub News] News request failed (${response.status}) for ${siteUrl}. ${body.slice(0, 300)}`
      );
      return [];
    }

    const json: IListResponse = await response.json();
    const rows = json.value || [];
    console.info(`[Hub News] ${siteUrl} returned ${rows.length} news post(s).`);

    return rows.map((raw) => this._mapItem(raw)).filter((entry) => !!entry.item.title);
  }

  private _mapItem(raw: IListItem): IDatedItem {
    const origin = this._origin();
    const dateStr = raw.FirstPublishedDate || raw.Modified || raw.Created || '';
    const time = dateStr ? new Date(dateStr).getTime() : 0;

    const item: INewsItem = {
      id: raw.FileRef || raw.Title || Math.random().toString(36).slice(2),
      title: raw.Title || '',
      summary: this._clamp(raw.Description, 200) || undefined,
      author: (raw.Author && raw.Author.Title) || undefined,
      meta: formatRelativeDate(dateStr),
      url: raw.FileRef ? origin + raw.FileRef : undefined,
      imageUrl: (raw.BannerImageUrl && raw.BannerImageUrl.Url) || undefined
    };

    return { item, date: isNaN(time) ? 0 : time };
  }

  private _origin(): string {
    return this.context.pageContext.web.absoluteUrl.split('/').slice(0, 3).join('/');
  }

  private _clamp(text: string | undefined, max: number): string {
    if (!text) {
      return '';
    }
    const trimmed = text.trim();
    return trimmed.length > max ? `${trimmed.slice(0, max - 1).replace(/\s+$/, '')}…` : trimmed;
  }
}
