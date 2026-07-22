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
 * News pages are identified by the managed property `PromotedState=2` (numeric —
 * `=`, not `:`, which SharePoint rejects with a generic 500 "UnknownError").
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
    rows.sort((a, b) => this._created(b) - this._created(a)); // newest first
    return rows
      .map((row) => this._mapRow(row))
      .filter((item) => !!item.title)
      .slice(0, Math.max(1, query.count || rows.length));
  }

  private async _runSearch(query: INewsQuery): Promise<ISearchRow[]> {
    const queryText = this._buildQueryText(query);
    // Over-fetch, then sort newest-first client-side, so no `sortlist` parameter
    // is sent (keeps the request to the shape verified working on the tenant).
    const rowLimit = Math.min(50, Math.max(query.count || 5, 25));

    const params = [
      `querytext='${this._encodeQueryText(queryText)}'`,
      `selectproperties='${SELECT_PROPERTIES}'`,
      `rowlimit=${rowLimit}`,
      `trimduplicates=false`,
      `clienttype='ContentSearchRegular'`
    ].join('&');

    const endpoint = `${this.context.pageContext.web.absoluteUrl}/_api/search/query?${params}`;
    const options: ISPHttpClientOptions = {
      headers: { Accept: 'application/json;odata=nometadata' }
    };

    const response: SPHttpClientResponse = await this.context.spHttpClient.get(
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
    const rows = json.PrimaryQueryResult?.RelevantResults?.Table?.Rows ?? [];
    console.info(`[Hub News] Query "${queryText}" returned ${rows.length} row(s).`);
    return rows;
  }

  /**
   * Encodes the KQL for the `querytext` parameter WITHOUT touching the operators.
   * SharePoint returns 500 "UnknownError" if `=` / `:` arrive percent-encoded
   * (%3D / %3A) — a raw operator is required — so we only escape OData single
   * quotes and encode spaces. (Verified against the tenant: raw `=` works.)
   */
  private _encodeQueryText(text: string): string {
    return text.replace(/'/g, "''").replace(/ /g, '%20');
  }

  private _buildQueryText(query: INewsQuery): string {
    let kql = 'PromotedState=2';
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

  /** Created timestamp (ms) from a row, for newest-first client-side sorting. */
  private _created(row: ISearchRow): number {
    for (const cell of row.Cells) {
      if (cell.Key === 'Created' && cell.Value) {
        const time = new Date(cell.Value).getTime();
        return isNaN(time) ? 0 : time;
      }
    }
    return 0;
  }

  private _clamp(text: string | undefined, max: number): string {
    if (!text) {
      return '';
    }
    const trimmed = text.trim();
    return trimmed.length > max ? `${trimmed.slice(0, max - 1).replace(/\s+$/, '')}…` : trimmed;
  }
}
