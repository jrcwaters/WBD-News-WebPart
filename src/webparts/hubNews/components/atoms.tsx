import * as React from 'react';
import styles from './HubNews.module.scss';
import { INewsItem, NewsTone } from '../models/INewsItem';
import { gradientIndex } from '../services/newsUtils';

/** Category pill, coloured by tone (design: .tag / .tag.firm / .tag.people / .tag.office). */
export const Tag: React.FC<{ category?: string; tone?: NewsTone }> = ({ category, tone }) => {
  if (!category) {
    return null;
  }
  const toneClass: Record<NewsTone, string> = {
    default: styles.toneDefault,
    firm: styles.toneFirm,
    people: styles.tonePeople,
    office: styles.toneOffice
  };
  return <span className={`${styles.tag} ${toneClass[tone || 'default']}`}>{category}</span>;
};

/** Author + date byline. `prefix` adds the leading "By " (used everywhere except the side list). */
export const Byline: React.FC<{ author?: string; meta?: string; prefix?: boolean }> = ({
  author,
  meta,
  prefix
}) => {
  if (!author && !meta) {
    return null;
  }
  return (
    <div className={styles.byline}>
      {author ? (
        <>
          {prefix ? 'By ' : ''}
          <b>{author}</b>
        </>
      ) : null}
      {author && meta ? ' · ' : ''}
      {meta || ''}
    </div>
  );
};

/** Thumbnail: real image when available, otherwise a deterministic brand gradient. */
export const NewsThumb: React.FC<{ item: INewsItem; children?: React.ReactNode }> = ({
  item,
  children
}) => {
  const gradients: string[] = [styles.g1, styles.g2, styles.g3, styles.g4, styles.g5];
  const hasImage: boolean = !!item.imageUrl;
  const gradientClass: string = hasImage ? '' : gradients[gradientIndex(item.id) - 1];
  const style: React.CSSProperties | undefined = hasImage
    ? { backgroundImage: `url("${item.imageUrl}")` }
    : undefined;

  return (
    <div className={`${styles.thumb} ${gradientClass}`} style={style} aria-hidden={true}>
      {children}
    </div>
  );
};

/** Wraps a card as a whole-card link when a URL is present, otherwise a plain container. */
export const CardShell: React.FC<{ url?: string; className: string; children: React.ReactNode }> = ({
  url,
  className,
  children
}) => {
  if (url) {
    return (
      <a className={className} href={url}>
        {children}
      </a>
    );
  }
  return <div className={className}>{children}</div>;
};
