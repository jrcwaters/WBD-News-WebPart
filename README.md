# Hub News — SPFx web part

A single **configurable** SharePoint Framework news web part for the intranet ("The Hub").
Drop it on a page as many times as you like and give each instance different property
settings — it is **one** web part, not three. A `layout` property switches between three
presentation modes that all share the same card treatment, firm blue (`#173a70`) and
yellow accent (`#ffc72c`) styling.

This is a **standalone solution** with its own package (`hub-news.sppkg`) and an
independent release lifecycle — it does not depend on, and is not bundled with, any other
web part.

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
| `source` | Dropdown | `all` (everything you can see), `growth` (**Growth @ WBD** — `/sites/SPIN_OurStrategy`), `you` (**You & WBD** — `/sites/SPIN_News`), `custom`. |
| `audience` | Text | Only for `all` (optional extra filter) and `custom` (a **site URL** → Path filter, or a raw **KQL** fragment). Ignored for the named feeds. |
| `itemCount` | Slider (1–8) | Number of stories to show. |
| `seeAllText` / `seeAllUrl` | Text | Optional "See all" link in the header. |
| `useMockData` | Toggle | **On** = built-in sample content (default, great for the workbench). **Off** = live SharePoint news. |

## Data sources

The rendering layer is decoupled from the data via `INewsService`:

- **`MockNewsService`** — built-in sample stories that mirror the design spec, keyed by
  `source`. Lets the web part render fully in the workbench and anywhere the live roll-up
  is turned off.
- **`SharePointNewsService`** — rolls up modern SharePoint **news pages** using the Search
  REST **POST `postquery`** endpoint (`PromotedState=2`; POST keeps the query in the body so
  the querytext quotes aren't URL-encoded, which the GET endpoint rejects), sorted
  client-side by most recent. `all` is tenant-wide; `growth` and
  `you` scope to their sites via a `Path:` filter whose absolute URL is resolved from the
  current tenant origin at runtime (no hard-coded host). Any failure degrades to a graceful
  empty state rather than an error.

To point the web part at live news, turn **Use sample content** off in the property pane.
The named feeds live in `SITE_PATHS` at the top of `SharePointNewsService.ts` — edit those
server-relative paths (or add more) if a feed moves. Category → pill-tone mapping in
`newsUtils.ts` is intentionally simple and can be tuned to your managed properties.

## Build & deploy

> Built and validated against **SPFx 1.21.1** on **Node 22**. If your build agents run a
> different Node LTS, pin the matching SPFx version in `package.json`.

```bash
npm install

# local development against the hosted workbench
gulp serve

# production package -> ./sharepoint/solution/hub-news.sppkg
gulp bundle --ship
gulp package-solution --ship
```

Upload `hub-news.sppkg` to your tenant **App Catalog**, then add **Hub News** to a page
from the *Text, media, and content* group in the web part toolbox. Add it multiple times
and configure each instance independently.

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
