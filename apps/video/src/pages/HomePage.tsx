import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { Pagination } from '../components/Pagination';
import { SidebarBox } from '../components/SidebarBox';
import { VideoCard } from '../components/VideoCard';
import { formatDate, formatViews, relativeTime } from '../lib/format';
import { paginate, parsePage } from '../lib/pagination';
import { sortVideos } from '../lib/sort';
import { readFlag, writeFlag } from '../store/persistence';
import { usePageTitle } from '../lib/usePageTitle';
import { useStore } from '../store/AppStore';

const NOTICE_KEY = 'openreel.notice.home.dismissed';
const POPULAR_CATEGORIES = ['Music', 'How to & Style', 'Comedy', 'Gaming', 'Travel & Events'];

export function HomePage() {
  usePageTitle('Home');
  const { videos, subscriptions, profile } = useStore();
  const [params] = useSearchParams();
  const page = parsePage(params.get('page'));
  const [noticeOpen, setNoticeOpen] = useState(() => !readFlag(NOTICE_KEY, false));

  const newestFirst = sortVideos(videos, 'newest');
  const recent = paginate(newestFirst, page, 12);
  const featured = sortVideos(videos, 'views').slice(0, 3);
  const watchingNow = newestFirst.slice(0, 4);
  const subscriptionUpdates = newestFirst
    .filter((video) => subscriptions.includes(video.channelId))
    .slice(0, 5);

  const popularByCategory = POPULAR_CATEGORIES.map((category) => ({
    category,
    top: sortVideos(
      videos.filter((video) => video.category === category),
      'views',
    )[0],
  })).filter((entry) => entry.top);

  return (
    <>
      {noticeOpen ? (
        <div className="notice">
          <p>
            <strong>Local preview.</strong>   Everything on this page runs in your
            browser: subscriptions, votes, comments, playlists and uploads are
            stored locally, not on a server.
          </p>
          <button
            type="button"
            className="notice__close"
            aria-label="Dismiss notice"
            onClick={() => {
              writeFlag(NOTICE_KEY, true);
              setNoticeOpen(false);
            }}
          >
            ×
          </button>
        </div>
      ) : null}

      <div className="home-grid">
        <div className="home-main">
          <section className="home-strip" aria-labelledby="watching-now">
            <header className="section-head">
              <h1 id="watching-now" className="section-head__title">
                Videos Being Watched Now
              </h1>
              <Link className="section-head__action" to="/videos?sort=views">
                view all
              </Link>
            </header>
            <ul className="strip">
              {watchingNow.map((video) => (
                <li key={video.id}>
                  <VideoCard video={video} />
                </li>
              ))}
            </ul>
          </section>

          <section className="home-featured" aria-labelledby="featured-videos">
            <header className="section-head">
              <h2 id="featured-videos" className="section-head__title">
                Featured Videos
              </h2>
            </header>
            <div className="feature-grid">
              {featured[0] ? <VideoCard video={featured[0]} variant="feature" /> : null}
              <div className="feature-side">
                {featured.slice(1).map((video) => (
                  <VideoCard key={video.id} video={video} variant="compact" />
                ))}
              </div>
            </div>
          </section>

          <section aria-labelledby="recently-uploaded">
            <header className="section-head">
              <h2 id="recently-uploaded" className="section-head__title">
                Recently Uploaded
              </h2>
              <Link className="section-head__action" to="/videos?sort=newest">
                view all
              </Link>
            </header>
            {recent.items.length === 0 ? (
              <EmptyState title="No videos yet">
                <p>
                  Nothing has been added. <Link to="/upload">Upload a video</Link>{' '}
                  to start the library.
                </p>
              </EmptyState>
            ) : (
              <div className="video-grid">
                {recent.items.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            )}
            <Pagination page={recent.page} pageCount={recent.pageCount} />
          </section>
        </div>

        <aside className="home-rail" aria-label="More to browse">
          <SidebarBox title="Most Popular" actionLabel="browse" actionTo="/videos">
            <ul className="popular-list">
              {popularByCategory.map(({ category, top }) => (
                <li key={category} className="popular-list__item">
                  <Link className="popular-list__category" to={`/videos/${encodeURIComponent(category)}`}>
                    {category}
                  </Link>
                  {top ? (
                    <>
                      <h3 className="popular-list__title">
                        <Link to={`/watch/${top.id}`}>{top.title}</Link>
                      </h3>
                      <p className="meta">
                        {relativeTime(top.uploadedAt)} · {formatViews(top.views)}
                      </p>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          </SidebarBox>

          <SidebarBox
            title="Subscription Updates"
            actionLabel="see all"
            actionTo="/subscriptions"
          >
            {!profile ? (
              <p className="box__note">
                <Link to="/signin?next=%2Fsubscriptions">Sign in</Link> to follow
                channels and keep a chronological feed.
              </p>
            ) : subscriptionUpdates.length === 0 ? (
              <p className="box__note">
                You are not subscribed to anything yet.{' '}
                <Link to="/channels">Find a channel</Link> to follow.
              </p>
            ) : (
              <ul className="compact-list">
                {subscriptionUpdates.map((video) => (
                  <li key={video.id}>
                    <VideoCard video={video} variant="compact" />
                  </li>
                ))}
              </ul>
            )}
          </SidebarBox>

          <SidebarBox title="What's New">
            <ul className="news-list">
              <li>
                <p className="news-list__title">Milestone 1 is live</p>
                <p className="meta">{formatDate('2026-11-20T12:00:00.000Z')}</p>
                <p>
                  Browsing, search, channels, playlists, comments and local uploads
                  work in the browser. Accounts and real storage come next.
                </p>
              </li>
              <li>
                <p className="news-list__title">Local only, for now</p>
                <p>
                  Your profile, subscriptions, votes, comments, playlists and drafts
                  live in this browser until a backend arrives.
                </p>
              </li>
              <li>
                <p className="news-list__title">No recommendation engine</p>
                <p>
                  Related videos are picked by channel, category and shared tags.
                  Nothing is learned about you.
                </p>
              </li>
            </ul>
          </SidebarBox>
        </aside>
      </div>
    </>
  );
}
