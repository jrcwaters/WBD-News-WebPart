import * as React from 'react';
import styles from '../HubNews.module.scss';
import { INewsItem } from '../../models/INewsItem';
import { CardShell, NewsThumb, Tag, Byline } from '../atoms';

/**
 * Layout A — one hero story with a supporting column of smaller items.
 */
export const LeadListLayout: React.FC<{ items: INewsItem[] }> = ({ items }) => {
  if (!items.length) {
    return null;
  }
  const lead: INewsItem = items[0];
  const rest: INewsItem[] = items.slice(1);

  return (
    <div className={styles.leadLayout}>
      <CardShell url={lead.url} className={styles.lead}>
        <NewsThumb item={lead}>
          <Tag category={lead.category} tone={lead.tone} />
        </NewsThumb>
        <div className={styles.body}>
          <h3>{lead.title}</h3>
          {lead.summary ? <p>{lead.summary}</p> : null}
          <Byline author={lead.author} meta={lead.meta} prefix={true} />
        </div>
      </CardShell>

      <div className={styles.sideList}>
        {rest.map((item) => (
          <CardShell key={item.id} url={item.url} className={styles.sideItem}>
            <NewsThumb item={item} />
            <div className={styles.siBody}>
              {item.category ? (
                <div className={styles.row}>
                  <Tag category={item.category} tone={item.tone} />
                </div>
              ) : null}
              <h4>{item.title}</h4>
              <Byline author={item.author} meta={item.meta} />
            </div>
          </CardShell>
        ))}
      </div>
    </div>
  );
};
