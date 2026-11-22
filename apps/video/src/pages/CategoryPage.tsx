import { Link, useParams, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { Pagination } from '../components/Pagination';
import { SortTabs } from '../components/SortTabs';
import { VideoCard } from '../components/VideoCard';
import { plural } from '../lib/format';
import { paginate, parsePage } from '../lib/pagination';
import { sortVideos, type VideoSort } from '../lib/sort';
import { usePageTitle } from '../lib/usePageTitle';
import { useStore } from '../store/AppStore';
import { normalizeCategory } from '../lib/categories';
import { CATEGORIES, type Category } from '../types';
import { NotFoundPage } from './NotFoundPage';

const SORTS: Array<{ key: VideoSort; label: string }> = [
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'views', label: 'Most viewed' },
];

export function CategoryPage() {
  const { category: raw } = useParams();
  const [params] = useSearchParams();
  const { videos } = useStore();

  // React Router already decodes parameters.
  // Old links and stored drafts may use a superseded spelling; normalise before
  // deciding whether the category exists.
  const category = normalizeCategory(raw ?? '');
  const isKnown = (CATEGORIES as readonly string[]).includes(category);
  usePageTitle(isKnown ? category : 'Category not found');

  const requestedSort = params.get('sort');
  const sort: VideoSort =
    SORTS.find((option) => option.key === requestedSort)?.key ?? 'newest';
  const page = parsePage(params.get('page'));

  if (!isKnown) return <NotFoundPage />;

  const paged = paginate(
    sortVideos(
      videos.filter((video) => video.category === (category as Category)),
      sort,
    ),
    page,
    12,
  );

  /** The default ordering needs no query, and sort changes reset pagination. */
  const tabHref = (key: VideoSort) =>
    key === 'newest'
      ? `/videos/${encodeURIComponent(category)}`
      : `/videos/${encodeURIComponent(category)}?sort=${key}`;

  return (
    <>
      <div className="breadcrumb">
        <Link to="/">Home</Link> <span aria-hidden="true">›</span>{' '}
        <Link to="/categories">Categories</Link> <span aria-hidden="true">›</span>{' '}
        {category}
      </div>
      <h1 className="page-title">{category}</h1>

      <SortTabs
        options={SORTS.map((option) => ({ ...option, href: tabHref(option.key) }))}
        current={sort}
      />

      {paged.items.length === 0 ? (
        <EmptyState title="Nothing in this category yet">
          <p>
            No videos have been added here. <Link to="/categories">Try another category</Link>.
          </p>
        </EmptyState>
      ) : (
        <>
          <p className="meta results-count">
            {paged.total} {plural(paged.total, 'video')} in {category}
          </p>
          <div className="video-grid">
            {paged.items.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
          <Pagination page={paged.page} pageCount={paged.pageCount} />
        </>
      )}
    </>
  );
}
