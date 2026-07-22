import { WebPartContext } from '@microsoft/sp-webpart-base';
import { MSGraphClientV3 } from '@microsoft/sp-http';

/** A SharePoint site returned from a site search. */
export interface ISite {
  title: string;
  url: string;
}

interface IGraphSite {
  displayName?: string;
  name?: string;
  webUrl?: string;
}
interface IGraphSitesResponse {
  value?: IGraphSite[];
}

/**
 * Searches SharePoint sites via Microsoft Graph (`GET /sites?search=`).
 *
 * Requires the delegated Graph permission **Sites.Read.All**, which a tenant admin
 * approves once in SharePoint Admin → Advanced → API access (declared in
 * package-solution.json under `webApiPermissionRequests`). Until it is approved the
 * Graph call returns 403 and the picker shows a friendly message.
 */
export class SiteSearchService {
  constructor(private readonly context: WebPartContext) {}

  public async search(query: string): Promise<ISite[]> {
    const q = (query || '').trim();
    if (q.length < 2) {
      return [];
    }

    const client: MSGraphClientV3 = await this.context.msGraphClientFactory.getClient('3');
    const response: IGraphSitesResponse = await client
      .api(`/sites?search=${encodeURIComponent(q)}`)
      .select('displayName,name,webUrl')
      .top(25)
      .get();

    return (response.value || [])
      .filter((site) => !!site.webUrl)
      .map((site) => ({
        title: site.displayName || site.name || (site.webUrl as string),
        url: site.webUrl as string
      }));
  }
}
