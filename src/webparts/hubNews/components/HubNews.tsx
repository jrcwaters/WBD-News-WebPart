import * as React from 'react';
import styles from './HubNews.module.scss';
import { IHubNewsProps } from './IHubNewsProps';
import { INewsItem } from '../models/INewsItem';
import { LeadListLayout } from './layouts/LeadListLayout';
import { GridLayout } from './layouts/GridLayout';
import { CompactLayout } from './layouts/CompactLayout';

type Status = 'loading' | 'ready' | 'empty' | 'error';

const HubNews: React.FC<IHubNewsProps> = (props) => {
  const { title, layout, source, audience, sites, itemCount, seeAllText, seeAllUrl, service, dataMode } = props;

  const [items, setItems] = React.useState<INewsItem[]>([]);
  const [status, setStatus] = React.useState<Status>('loading');

  // Keep the latest service without making it an effect dependency (it is a fresh
  // object each render); `dataMode` is the primitive that signals a provider change.
  const serviceRef = React.useRef(service);
  serviceRef.current = service;

  // Stable primitive so the fetch effect re-runs when the selected sites change.
  const sitesKey = (sites || []).join('|');

  React.useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    const siteList = sitesKey ? sitesKey.split('|') : [];
    serviceRef.current
      .getNews({ source, audience, sites: siteList, count: itemCount })
      .then((result) => {
        if (cancelled) {
          return;
        }
        const list = result || [];
        setItems(list);
        setStatus(list.length ? 'ready' : 'empty');
      })
      .catch(() => {
        if (!cancelled) {
          setItems([]);
          setStatus('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [source, audience, sitesKey, itemCount, dataMode]);

  const renderLayout = (): React.ReactNode => {
    switch (layout) {
      case 'grid':
        return <GridLayout items={items} />;
      case 'compact':
        return <CompactLayout items={items} />;
      case 'lead':
      default:
        return <LeadListLayout items={items} />;
    }
  };

  const showHeader: boolean = !!title || !!seeAllText;

  return (
    <section className={styles.hubNews}>
      {showHeader && (
        <div className={styles.head}>
          <span className={styles.accent} aria-hidden={true} />
          {title ? <h2 className={styles.title}>{title}</h2> : null}
          {seeAllText ? (
            seeAllUrl ? (
              <a className={styles.seeAll} href={seeAllUrl}>
                {seeAllText} {'›'}
              </a>
            ) : (
              <span className={styles.seeAll}>
                {seeAllText} {'›'}
              </span>
            )
          ) : null}
        </div>
      )}

      {status === 'loading' && <div className={styles.state}>Loading news…</div>}

      {status === 'empty' && (
        <div className={styles.state}>
          No news to show yet.
          {dataMode === 'sharepoint'
            ? ' Nothing is indexed for this Source yet — publish News posts (not just pages), allow a few minutes for indexing, or widen the Source.'
            : ''}
        </div>
      )}

      {status === 'error' && (
        <div className={styles.state}>
          Couldn’t load news — the search request failed. Open the browser console (F12) for the
          query and status code, then check the Source / scope.
        </div>
      )}

      {status === 'ready' && renderLayout()}
    </section>
  );
};

export default HubNews;
