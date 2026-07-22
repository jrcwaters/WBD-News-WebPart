import * as React from 'react';
import styles from '../HubNews.module.scss';
import { INewsItem } from '../../models/INewsItem';
import { CardShell, NewsThumb, Tag, Byline } from '../atoms';

/**
 * Layout C — dense thumbnail-and-title rows for sidebars / lower zones.
 */
export const CompactLayout: React.FC<{ items: INewsItem[] }> = ({ items }) => {
  if (!items.length) {
    return null;
  }
  return (
    <div className={styles.compactLayout}>
      {items.map((item) => (
        <CardShell key={item.id} url={item.url} className={styles.compactItem}>
          <NewsThumb item={item} />
          <div className={styles.ciBody}>
            {item.category ? (
              <div className={styles.row}>
                <Tag category={item.category} tone={item.tone} />
              </div>
            ) : null}
            <h4>{item.title}</h4>
            <Byline author={item.author} meta={item.meta} prefix={true} />
          </div>
          <span className={styles.chev} aria-hidden={true}>
            {'›'}
          </span>
        </CardShell>
      ))}
    </div>
  );
};
