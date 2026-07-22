import * as React from 'react';
import styles from '../HubNews.module.scss';
import { INewsItem } from '../../models/INewsItem';
import { CardShell, NewsThumb, Tag, Byline } from '../atoms';

/**
 * Layout B — even-emphasis card grid (up to three across, then wraps).
 */
export const GridLayout: React.FC<{ items: INewsItem[] }> = ({ items }) => {
  if (!items.length) {
    return null;
  }
  return (
    <div className={styles.gridLayout}>
      {items.map((item) => (
        <CardShell key={item.id} url={item.url} className={styles.newsCard}>
          <NewsThumb item={item}>
            <Tag category={item.category} tone={item.tone} />
          </NewsThumb>
          <div className={styles.body}>
            <h3>{item.title}</h3>
            {item.summary ? <p>{item.summary}</p> : null}
            <Byline author={item.author} meta={item.meta} prefix={true} />
          </div>
        </CardShell>
      ))}
    </div>
  );
};
