import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { Pagination } from '../components/Pagination';
import { VideoCard } from '../components/VideoCard';
import { plural } from '../lib/format';
import { parsePage } from '../lib/pagination';
import { searchVideos, SORT_LABELS, type SortKey } from '../lib/search';
import { usePageTitle } from '../lib/usePageTitle';
import { useStore } from '../store/AppStore';
import { CATEGORIES } from '../types';

const SORTS = Object.keys(SORT_LABELS) as SortKey[];

export function SearchPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { videos, channels } = useStore();

  const q = (params.get('q') ?? '').trim();
  const requestedSort = params.get('sort');
  const sort: SortKey = SORTS.includes(requestedSort as SortKey)
    ? (requestedSort as SortKey)
    : 'relevance';
  const category = params.get('category') ?? 'All';
  const page = parsePage(params.get('page'));

  usePageTitle(q ? `Search: ${q}` : 'Search');

  const result = searchVideos(
    { videos, channels },
    { q, sort, category: category as (typeof CATEGORIES)[number] | 'All', page, pageSize: 10 },
  );

  /** Preserve the current query while changing one refinement. */
  const refineHref = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined) next.delete(key);
      else next.set(key, value);
    }
    if ('sort' in changes || 'category' in changes) next.delete('page');
    const query = next.toString();
    return query ? `/results?${query}` : '/results';
  };

  return (
    <>
      <div className="breadcrumb">
        <Link to="/">Home</Link> <span aria-hidden="true">›</span> Search
      </div>
      <h1 className="page-title">{q ? `Results for “${q}”` : 'Search'}</h1>

      <div className="search-layout">
        <aside className="search-refine" aria-label="Refine results">
          <section aria-labelledby="refine-sort">
            <h2 id="refine-sort" className="refine__heading">
              Sort by
            </h2>
            <ul className="refine__list">
              {SORTS.map((option) => (
                <li key={option}>
                  <Link
                    to={refineHref({ sort: option === 'relevance' ? undefined : option })}
                    className={sort === option ? 'is-current' : undefined}
                    aria-current={sort === option ? 'true' : undefined}
                  >
                    {SORT_LABELS[option]}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="refine-category">
            <h2 id="refine-category" className="refine__heading">
              Category
            </h2>
            <label className="sr-only" htmlFor="category-filter">
              Filter by category
            </label>
            <select
              id="category-filter"
              className="refine__select"
              value={category}
              onChange={(event) => {
                navigate(
                  refineHref({
                    category: event.target.value === 'All' ? undefined : event.target.value,
                  }),
                );
              }}
            >
              <option value="All">All categories</option>
              {CATEGORIES.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </section>

          <section aria-labelledby="refine-clear">
            <h2 id="refine-clear" className="refine__heading">
              Filters
            </h2>
            <p className="meta">
              Matching looks at titles, descriptions, channel names, categories and
              tags. Nothing is personalised.
            </p>
            <p>
              <Link to="/results">Clear all filters</Link>
            </p>
          </section>
        </aside>

        <div>
          {!q ? (
            <EmptyState title="Search the library">
              <p>
                Type a word in the search box above. Results can be sorted by
                relevance, newest, oldest and most viewed.
              </p>
              <p>
                Or <Link to="/categories">browse by category</Link> instead.
              </p>
            </EmptyState>
          ) : result.total === 0 ? (
            <EmptyState title="No results">
              <p>
                Nothing matched “{q}”
                {category !== 'All' ? ` in ${category}` : ''}. Try a shorter query,
                check the spelling, or{' '}
                <Link to={refineHref({ category: undefined })}>search all categories</Link>.
              </p>
              <p>
                <Link to="/categories">Browse categories</Link>
              </p>
            </EmptyState>
          ) : (
            <>
              <p className="results-count">
                {result.total.toLocaleString('en-US')} {plural(result.total, 'result')} for “{q}”
                {category !== 'All' ? ` in ${category}` : ''} · sorted by{' '}
                {SORT_LABELS[sort].toLowerCase()}
              </p>
              <ul className="result-list">
                {result.items.map((video) => (
                  <li key={video.id}>
                    <VideoCard video={video} variant="row" />
                  </li>
                ))}
              </ul>
              <Pagination page={result.page} pageCount={result.pageCount} />
            </>
          )}
        </div>
      </div>
    </>
  );
}
