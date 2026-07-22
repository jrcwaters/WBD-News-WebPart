import * as React from 'react';
import { SearchBox } from '@fluentui/react/lib/SearchBox';
import { Spinner, SpinnerSize } from '@fluentui/react/lib/Spinner';
import { Icon } from '@fluentui/react/lib/Icon';
import { ISite } from '../services/SiteSearchService';
import styles from './SitePicker.module.scss';

export interface ISitePickerProps {
  label: string;
  selectedUrl: string;
  selectedTitle: string;
  search: (query: string) => Promise<ISite[]>;
  onChanged: (url: string, title: string) => void;
}

type Status = 'idle' | 'searching' | 'error';

const DEBOUNCE_MS: number = 400;

export const SitePicker: React.FC<ISitePickerProps> = (props) => {
  const [query, setQuery] = React.useState<string>('');
  const [results, setResults] = React.useState<ISite[]>([]);
  const [status, setStatus] = React.useState<Status>('idle');
  const timer = React.useRef<number | undefined>(undefined);

  const onQueryChange = (value: string): void => {
    setQuery(value);
    if (timer.current) {
      window.clearTimeout(timer.current);
    }
    if (value.trim().length < 2) {
      setResults([]);
      setStatus('idle');
      return;
    }
    timer.current = window.setTimeout(() => {
      setStatus('searching');
      props
        .search(value.trim())
        .then((sites) => {
          setResults(sites);
          setStatus('idle');
        })
        .catch(() => {
          setResults([]);
          setStatus('error');
        });
    }, DEBOUNCE_MS);
  };

  const select = (site: ISite): void => {
    props.onChanged(site.url, site.title);
    setResults([]);
    setQuery('');
    setStatus('idle');
  };

  return (
    <div className={styles.sitePicker}>
      {props.label ? <label className={styles.label}>{props.label}</label> : null}

      {props.selectedUrl ? (
        <div className={styles.selected}>
          <Icon iconName="Globe" className={styles.selectedIcon} />
          <div className={styles.selectedText}>
            <div className={styles.selectedTitle}>{props.selectedTitle || props.selectedUrl}</div>
            <div className={styles.selectedUrl}>{props.selectedUrl}</div>
          </div>
          <button
            type="button"
            className={styles.clear}
            aria-label="Clear selected site"
            onClick={() => props.onChanged('', '')}
          >
            {'✕'}
          </button>
        </div>
      ) : null}

      <SearchBox
        placeholder="Search for a site…"
        value={query}
        onChange={(_ev, value) => onQueryChange(value || '')}
        underlined={true}
      />

      {status === 'searching' ? (
        <Spinner size={SpinnerSize.small} label="Searching…" labelPosition="right" className={styles.spinner} />
      ) : null}

      {status === 'error' ? (
        <div className={styles.msg}>
          Couldn&rsquo;t search sites. The <strong>Sites.Read.All</strong> Graph permission may still need admin
          approval (SharePoint Admin &rarr; Advanced &rarr; API access).
        </div>
      ) : null}

      {status === 'idle' && results.length > 0 ? (
        <div className={styles.results} role="listbox">
          {results.map((site) => (
            <button
              key={site.url}
              type="button"
              role="option"
              aria-selected={false}
              className={styles.result}
              onClick={() => select(site)}
            >
              <span className={styles.resultTitle}>{site.title}</span>
              <span className={styles.resultUrl}>{site.url}</span>
            </button>
          ))}
        </div>
      ) : null}

      {status === 'idle' && query.trim().length >= 2 && results.length === 0 ? (
        <div className={styles.msg}>No sites found.</div>
      ) : null}
    </div>
  );
};
