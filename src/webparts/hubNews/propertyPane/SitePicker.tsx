import * as React from 'react';
import { SearchBox } from '@fluentui/react/lib/SearchBox';
import { Spinner, SpinnerSize } from '@fluentui/react/lib/Spinner';
import { Icon } from '@fluentui/react/lib/Icon';
import { ISite } from '../services/SiteSearchService';
import styles from './SitePicker.module.scss';

export interface ISitePickerProps {
  label: string;
  selected: ISite[];
  search: (query: string) => Promise<ISite[]>;
  onChanged: (sites: ISite[]) => void;
}

type Status = 'idle' | 'searching' | 'error';

const DEBOUNCE_MS: number = 400;

export const SitePicker: React.FC<ISitePickerProps> = (props) => {
  const [selected, setSelected] = React.useState<ISite[]>(props.selected || []);
  const [query, setQuery] = React.useState<string>('');
  const [results, setResults] = React.useState<ISite[]>([]);
  const [status, setStatus] = React.useState<Status>('idle');
  const timer = React.useRef<number | undefined>(undefined);

  const commit = (next: ISite[]): void => {
    setSelected(next);
    props.onChanged(next);
  };

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

  const add = (site: ISite): void => {
    if (selected.some((s) => s.url === site.url)) {
      return;
    }
    commit([...selected, site]);
  };

  const remove = (url: string): void => {
    commit(selected.filter((s) => s.url !== url));
  };

  // Hide results that are already selected.
  const available: ISite[] = results.filter((r) => !selected.some((s) => s.url === r.url));

  return (
    <div className={styles.sitePicker}>
      {props.label ? <label className={styles.label}>{props.label}</label> : null}

      {selected.length > 0 ? (
        <div className={styles.selectedList}>
          {selected.map((site) => (
            <div key={site.url} className={styles.selected}>
              <Icon iconName="Globe" className={styles.selectedIcon} />
              <div className={styles.selectedText}>
                <div className={styles.selectedTitle}>{site.title || site.url}</div>
                <div className={styles.selectedUrl}>{site.url}</div>
              </div>
              <button
                type="button"
                className={styles.clear}
                aria-label={`Remove ${site.title || site.url}`}
                onClick={() => remove(site.url)}
              >
                {'✕'}
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <SearchBox
        placeholder="Search for a site to add…"
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

      {status === 'idle' && available.length > 0 ? (
        <div className={styles.results} role="listbox">
          {available.map((site) => (
            <button
              key={site.url}
              type="button"
              role="option"
              aria-selected={false}
              className={styles.result}
              onClick={() => add(site)}
            >
              <span className={styles.resultTitle}>{site.title}</span>
              <span className={styles.resultUrl}>{site.url}</span>
            </button>
          ))}
        </div>
      ) : null}

      {status === 'idle' && query.trim().length >= 2 && available.length === 0 ? (
        <div className={styles.msg}>
          {results.length === 0 ? 'No sites found.' : 'All matching sites are already added.'}
        </div>
      ) : null}
    </div>
  );
};
