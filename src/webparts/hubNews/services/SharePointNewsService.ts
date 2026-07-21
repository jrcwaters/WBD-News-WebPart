import { WebPartContext } from '@microsoft/sp-webpart-base';
import { SPHttpClient, SPHttpClientResponse, ISPHttpClientOptions } from '@microsoft/sp-http';
import { INewsItem } from '../models/INewsItem';
import { INewsService, INewsQuery } from './INewsService';
import { formatRelativeDate, toneFromCategory } from './newsUtils';

interface ISearchCell {
  Key: string;
  // The Search REST API returns null (not undefined) for empty cells.
  // eslint-disable-next-line @rushstack/no-new-null
  Value: string | null;
}
interface ISearchRow {
  Cells: ISearchCell[];
}
interface ISearchResult {
  RelevantResults?: {
    Table?: { Rows?: ISearchRow[] };
  };
}
interface ISearchResponse {
  PrimaryQueryResult?: ISearchResult;
  // Some tenants nest the postquery result under a `postquery` property.
  postquery?: { PrimaryQueryResult?: ISearchResult };
}

const SELECT_PROPERTIES: string =
  'Title,Path,PictureThumbnailURL,Created,Author,SiteTitle,Description';

/**
 * Server-relative paths for the named site feeds. The absolute URL is resolved
 * against the current tenant origin at runtime, so there is no hard-coded host.
 */
const SITE_PATHS: { [source: string]: string } = {
  growth: '/sites/SPIN_OurStrategy', // "Growth @ WBD"
  you: '/sites/SPIN_News' // "You & WBD"
};

/**
 * Rolls up modern SharePoint news pages across the hub using the Search REST API.
 * News pages are identified by the managed property `PromotedState:2`.
 *
 * The query is scoped by the web part's "source"/"audience" settings and results
 * are normalised into {@link INewsItem}. HTTP/network failures propagate so the web
 * part can show a distinct error state; a successful query with no matches is an
 * empty list.
 */
export class SharePointNewsService implements INewsService {
  constructor(private readonly context: WebPartContext) {}

  public async getNews(query: INewsQuery): Promise<INewsItem[]> {
    // Errors propagate so the web part can show a distinct "couldn't load" state
    // instead of an indistinguishable "no news" — see HubNews.tsx.
    const rows = await this._runSearch(query);
    return rows.map((row) => this._mapRow(row)).filter((item) => !!item.title);
  }

  private async _runSearch(query: INewsQuery): Promise<ISearchRow[]> {
    const rowLimit = Math.max(1, Math.min(query.count || 5, 50));
    const queryText = this._buildQueryText(query);

    // POST /_api/search/postquery — the GET /query endpoint returns
    // 500 "UnknownError" on some tenants once the query/sort params are
    // URL-encoded. POST takes a JSON body and avoids that entirely.
    const endpoint = `${this.context.pageContext.web.absoluteUrl}/_api/search/postquery`;
    const requestBody = {
      request: {
        Querytext: queryText,
        SelectProperties: SELECT_PROPERTIES.split(','),
        RowLimit: rowLimit,
        SortList: [{ Property: 'LastModifiedTime', Direction: 1 }],
        TrimDuplicates: false,
        ClientType: 'ContentSearchRegular'
      }
    };

    const options: ISPHttpClientOptions = {
      headers: {
        Accept: 'application/json;odata=nometadata',
        'Content-Type': 'application/json;odata=nometadata'
      },
      body: JSON.stringify(requestBody)
    };

    const response: SPHttpClientResponse = await this.context.spHttpClient.post(
      endpoint,
      SPHttpClient.configurations.v1,
      options
    );

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error(
        `[Hub News] Search request failed (${response.status}) for query "${queryText}". ${body.slice(0, 400)}`
      );
      throw new Error(`Hub News search request failed (${response.status})`);
    }

    const json: ISearchResponse = await response.json();
    const primary = json.PrimaryQueryResult ?? json.postquery?.PrimaryQueryResult;
    const rows = primary?.RelevantResults?.Table?.Rows ?? [];
    console.info(`[Hub News] Query "${queryText}" returned ${rows.length} row(s). Endpoint: ${endpoint}`);
    return rows;
  }

  private _buildQueryText(query: INewsQuery): string {
    let kql = 'PromotedState:2';
    const audience = (query.audience || '').trim();
    const sitePath = SITE_PATHS[query.source];

    if (sitePath) {
      // A named site feed (Growth @ WBD / You & WBD) — scope to that site's pages.
      kql += ` Path:${this._absoluteUrl(sitePath)}/*`;
    } else if (query.source === 'custom') {
      // Custom: a site URL (Path filter) or a raw KQL fragment.
      if (audience) {
        kql += this._looksLikeUrl(audience) ? this._pathFilter(audience) : ` ${audience}`;
      }
    } else if (audience) {
      // 'all' with an optional extra filter — a site URL, or a search term.
      kql += this._looksLikeUrl(audience) ? this._pathFilter(audience) : ` "${audience}"`;
    }

    return kql;
  }

  /** Builds a ` Path:<abs>*` scope, resolving a server-relative path to absolute. */
  private _pathFilter(input: string): string {
    const trimmed = input.replace(/\/+$/, '');
    const abs = /^https?:\/\//i.test(trimmed) ? trimmed : this._absoluteUrl(trimmed);
    return ` Path:${abs}*`;
  }

  private _looksLikeUrl(value: string): boolean {
    return /^https?:\/\//i.test(value) || value.charAt(0) === '/';
  }

  /** Prefixes a server-relative path with the current tenant origin. */
  private _absoluteUrl(relativePath: string): string {
    const origin = this.context.pageContext.web.absoluteUrl.split('/').slice(0, 3).join('/');
    return origin + relativePath;
  }

  private _mapRow(row: ISearchRow): INewsItem {
    const map: { [key: string]: string } = {};
    for (const cell of row.Cells) {
      if (cell.Value !== null && cell.Value !== undefined) {
        map[cell.Key] = cell.Value;
      }
    }

    const category = map.SiteTitle || '';
    const author = (map.Author || map.SiteTitle || '').split(';')[0].trim();
    const summary = this._clamp(map.Description, 200);

    return {
      id: map.Path || map.Title || Math.random().toString(36).slice(2),
      title: map.Title || '',
      summary: summary || undefined,
      category: category || undefined,
      tone: toneFromCategory(category),
      author: author || undefined,
      meta: formatRelativeDate(map.Created),
      url: map.Path || undefined,
      imageUrl: map.PictureThumbnailURL || undefined
    };
  }

  private _clamp(text: string | undefined, max: number): string {
    if (!text) {
      return '';
    }
    const trimmed = text.trim();
    return trimmed.length > max ? `${trimmed.slice(0, max - 1).replace(/\s+$/, '')}…` : trimmed;
  }
}
