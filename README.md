# WBD Hub — News (`wbd-hub-news`)

A single **configurable** SharePoint Framework news web part for the intranet ("The Hub").
Drop it on a page as many times as you like and give each instance different property
settings — it is **one** web part, not three. A `layout` property switches between three
presentation modes that all share the same card treatment, firm blue (`#173a70`) and
yellow accent (`#ffc72c`) styling.

This is a **standalone solution** with its own package (`wbd-hub-news.sppkg`) and an
independent release lifecycle. It shares the WBD Hub look and feel and a few
cross-cutting helpers (relative-date formatting and the sessionStorage cache) via the
`@wbd/hub-core` library component, but carries no other web part's code.

## Layouts

Chosen per instance via the **Layout** property (`PropertyPaneChoiceGroup`):

| Key | Name | Use it for |
| --- | --- | --- |
| `lead` | **Lead + list** | A feed with a clear headline — one hero story plus a supporting column. |
| `grid` | **Grid** | Peer stories with even emphasis, 2–3 across. Office / team feeds. |
| `compact` | **Compact** | Dense thumbnail-and-title rows for a sidebar or a lower zone. |

The layouts respond to the **web part's own width** (CSS container queries), so they
collapse correctly inside narrow SharePoint columns, not just at viewport breakpoints.

## Properties

| Property | Control | Notes |
| --- | --- | --- |
| `title` | Text | Heading shown next to the yellow accent bar (e.g. "Firm News"). |
| `layout` | Choice group | `lead` / `grid` / `compact`. |
| `source` | Dropdown | `all` (firm news sites), `growth` (**Growth @ WBD** — `/sites/SPIN_OurStrategy`), `you` (**You & WBD** — `/sites/SPIN_News`), **`picker`** (*Search for sites…* — search Graph and pick **one or more** sites), `custom` (type a site URL). |
| `audience` | Text | Only for `all` (optional extra site URL) and `custom` (a **site URL**). Ignored for the named feeds and the site search. |
| `selectedSites` | Site picker | `{ title, url }[]` chosen with the *Search for sites…* control; the service merges News from all of them. |
| `itemCount` | Slider (1–8) | Number of stories to show. |
| `seeAllText` / `seeAllUrl` | Text | Optional "See all" link in the header. |
| `useMockData` | Toggle | **On** = built-in sample content (default, great for the workbench). **Off** = live SharePoint news. |

## Data sources

The rendering layer is decoupled from the data via `INewsService`:

- **`MockNewsService`** — built-in sample stories that mirror the design spec, keyed by
  `source`. Lets the web part render fully in the workbench and anywhere the live roll-up
  is turned off.
- **`SharePointNewsService`** — reads modern SharePoint **News posts** (`PromotedState = 2`)
  directly from each site's *Site Pages* library via the list REST API — deliberately **not**
  the Search service, which proved unreliable on-tenant (the GET query endpoint URL-encodes
  the querytext quotes; the POST endpoint 500s). `growth` and `you` query their own site;
  `all` merges the firm's news sites; results are sorted newest-first, and a failure on any
  one site is skipped rather than blanking the web part.

To point the web part at live news, turn **Use sample content** off in the property pane.
The named feeds live in `SITE_PATHS` at the top of `SharePointNewsService.ts` — edit those
server-relative paths (or add more) if a feed moves. News posts carry no category column by
default, so the coloured pill is omitted for live items; map a page column onto `category` /
`tone` in `_mapItem` if you add one.

## Site search (property pane) — requires admin approval

The **Search for sites…** source uses a custom property-pane control
(`propertyPane/PropertyPaneSitePicker.ts` + `SitePicker.tsx`) that searches sites via
Microsoft Graph (`GET /sites?search=`, in `SiteSearchService.ts`). This needs the delegated
Graph permission **`Sites.Read.All`**, declared in `package-solution.json`
(`webApiPermissionRequests`).

> **A tenant admin must approve it once** after the package is deployed:
> SharePoint Admin → **Advanced → API access** → approve *Microsoft Graph → Sites.Read.All*.
> Until then the picker shows a "permission may need admin approval" message. The other
> sources (All / Growth / You / Custom) work without it.

## Build & deploy

> Built and validated against **SPFx 1.21.1** on **Node 22**. If your build agents run a
> different Node LTS, pin the matching SPFx version in `package.json`.

```bash
npm install

# local development against the hosted workbench
gulp serve

# production package -> ./sharepoint/solution/wbd-hub-news.sppkg
gulp bundle --ship
gulp package-solution --ship
```

Upload `wbd-hub-news.sppkg` to your tenant **App Catalog**, then add **News** to a page
from the **WBD Hub** group in the web part toolbox. Add it multiple times and configure
each instance independently.

## Project structure

```
src/webparts/hubNews/
├── HubNewsWebPart.ts            # web part shell + property pane
├── HubNewsWebPart.manifest.json # identity + default property values
├── components/
│   ├── HubNews.tsx              # container: fetch + status + layout switch
│   ├── HubNews.module.scss      # design tokens & styles (1:1 with the spec)
│   ├── atoms.tsx                # Tag, Byline, NewsThumb, CardShell
│   └── layouts/                 # LeadListLayout, GridLayout, CompactLayout
├── models/INewsItem.ts          # normalised story model
└── services/                    # INewsService, Mock + SharePoint providers, helpers
```
