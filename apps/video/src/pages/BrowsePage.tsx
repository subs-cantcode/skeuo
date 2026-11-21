import { Link, useSearchParams } from 'react-router-dom';
import { Pagination } from '../components/Pagination';
import { SortTabs } from '../components/SortTabs';
import { VideoCard } from '../components/VideoCard';
import { plural } from '../lib/format';
import { paginate, parsePage } from '../lib/pagination';
import { sortVideos, type VideoSort } from '../lib/sort';
import { usePageTitle } from '../lib/usePageTitle';
import { useStore } from '../store/AppStore';
import { CATEGORIES } from '../types';

const SORTS: Array<{ key: Extract<VideoSort, 'newest' | 'views'>; label: string }> = [
  { key: 'views', label: 'Most viewed' },
  { key: 'newest', label: 'Recently added' },
];

/** `/videos` and `/categories`: the era's category-first browsing surface. */
export function BrowsePage() {
  usePageTitle('Browse videos');
  const { videos } = useStore();
  const [params] = useSearchParams();
  const sort: VideoSort = params.get('sort') === 'newest' ? 'newest' : 'views';
  const page = parsePage(params.get('page'));

  const paged = paginate(sortVideos(videos, sort), page, 12);

  const counts = new Map<string, number>();
  for (const video of videos) {
    counts.set(video.category, (counts.get(video.category) ?? 0) + 1);
  }

  return (
    <>
      <div className="breadcrumb">
        <Link to="/">Home</Link> <span aria-hidden="true">›</span> Browse videos
      </div>
      <h1 className="page-title">Browse videos</h1>

      <div className="browse-grid">
        <div>
          <section aria-labelledby="category-index">
            <h2 id="category-index" className="section-head__title section-head__title--plain">
              Categories
            </h2>
            <ul className="category-table">
              {CATEGORIES.map((category) => {
                const count = counts.get(category) ?? 0;
                return (
                  <li key={category}>
                    <Link to={`/videos/${encodeURIComponent(category)}`}>{category}</Link>
                    <span className="meta">
                      {count} {plural(count, 'video')}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <div>
          <SortTabs
            options={SORTS.map((option) => ({
              ...option,
              href: option.key === 'views' ? '/videos' : `/videos?sort=${option.key}`,
            }))}
            current={sort}
          />
          <div className="video-grid">
            {paged.items.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
          <Pagination page={paged.page} pageCount={paged.pageCount} />
        </div>
      </div>
    </>
  );
}
