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
interface ISearchResponse {
  PrimaryQueryResult?: {
    RelevantResults?: {
      Table?: { Rows?: ISearchRow[] };
    };
  };
}

const SELECT_PROPERTIES: string =
  'Title,Path,PictureThumbnailURL,Created,Author,SiteTitle,Description';

/**
 * Rolls up modern SharePoint news pages across the hub using the Search REST API.
 * News pages are identified by the managed property `PromotedState:2`.
 *
 * The query is scoped by the web part's "source"/"audience" settings and results
 * are normalised into {@link INewsItem}. Any failure resolves to an empty list so
 * the web part shows a graceful empty state rather than an error.
 */
export class SharePointNewsService implements INewsService {
  constructor(private readonly context: WebPartContext) {}

  public async getNews(query: INewsQuery): Promise<INewsItem[]> {
    try {
      const rows = await this._runSearch(query);
      return rows.map((row) => this._mapRow(row)).filter((item) => !!item.title);
    } catch {
      return [];
    }
  }

  private async _runSearch(query: INewsQuery): Promise<ISearchRow[]> {
    const rowLimit = Math.max(1, Math.min(query.count || 5, 50));
    const queryText = this._buildQueryText(query);

    const params = [
      `querytext='${encodeURIComponent(queryText)}'`,
      `selectproperties='${encodeURIComponent(SELECT_PROPERTIES)}'`,
      `rowlimit=${rowLimit}`,
      `sortlist='${encodeURIComponent('Created:descending')}'`,
      `trimduplicates=false`,
      `clienttype='ContentSearchRegular'`
    ].join('&');

    const endpoint = `${this.context.pageContext.web.absoluteUrl}/_api/search/query?${params}`;
    const options: ISPHttpClientOptions = {
      headers: { Accept: 'application/json; odata=nometadata' }
    };

    const response: SPHttpClientResponse = await this.context.spHttpClient.get(
      endpoint,
      SPHttpClient.configurations.v1,
      options
    );

    if (!response.ok) {
      return [];
    }

    const json: ISearchResponse = await response.json();
    return json.PrimaryQueryResult?.RelevantResults?.Table?.Rows ?? [];
  }

  private _buildQueryText(query: INewsQuery): string {
    let kql = 'PromotedState:2';
    const audience = (query.audience || '').trim();

    if (query.source === 'custom') {
      // Treat the audience field as a raw KQL fragment for advanced scoping.
      if (audience) {
        kql += ` ${audience}`;
      }
    } else if (audience) {
      if (/^https?:\/\//i.test(audience) || audience.charAt(0) === '/') {
        // A site/path was supplied — scope the roll-up to it.
        kql += ` Path:${audience.replace(/\/+$/, '')}*`;
      } else {
        // A label (office / practice name) — narrow results by matching term.
        kql += ` "${audience}"`;
      }
    }

    return kql;
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
