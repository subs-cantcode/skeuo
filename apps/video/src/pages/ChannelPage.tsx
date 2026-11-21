import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { EmptyState } from '../components/EmptyState';
import { SignInPrompt } from '../components/SignInPrompt';
import { SubscribeButton } from '../components/SubscribeButton';
import { VideoCard } from '../components/VideoCard';
import { formatDate, formatSubscribers, plural } from '../lib/format';
import { sortVideos } from '../lib/sort';
import { usePageTitle } from '../lib/usePageTitle';
import { useStore } from '../store/AppStore';
import { NotFoundPage } from './NotFoundPage';

const TABS = ['videos', 'playlists', 'subscribers', 'about'] as const;
type Tab = (typeof TABS)[number];

export function ChannelPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { getChannel, videos, playlists, profile } = useStore();

  // "me" resolves through the store's own channel, which only exists signed in.
  const channel = id ? getChannel(id) : undefined;
  usePageTitle(channel ? channel.name : 'Channel not found');

  if (id === 'me' && !profile) {
    return (
      <>
        <h1 className="page-title">Your channel</h1>
        <SignInPrompt next="/channel/me">
          <p>
            Sign in with a local profile to create a channel page, upload videos and
            comment under a name.
          </p>
        </SignInPrompt>
      </>
    );
  }

  if (!channel) return <NotFoundPage />;

  const requestedTab = params.get('tab') as Tab | null;
  const tab: Tab = requestedTab && TABS.includes(requestedTab) ? requestedTab : 'videos';

  const channelVideos = sortVideos(
    videos.filter((video) => video.channelId === channel.id),
    'newest',
  );
  const channelVideoIds = new Set(channelVideos.map((video) => video.id));
  const channelPlaylists = playlists.filter((playlist) =>
    playlist.videoIds.some((videoId) => channelVideoIds.has(videoId)),
  );

  const tabHref = (target: Tab) =>
    target === 'videos' ? `/channel/${channel.id}` : `/channel/${channel.id}?tab=${target}`;
  const tabLabels: Record<Tab, string> = {
    videos: `Videos (${channelVideos.length})`,
    playlists: `Playlists (${channelPlaylists.length})`,
    subscribers: 'Subscribers',
    about: 'About',
  };

  return (
    <>
      <header className="channel-header" style={{ backgroundColor: channel.themeColor }}>
        <div className="channel-header__inner">
          <Avatar name={channel.name} color={channel.themeColor} size="large" />
          <div className="channel-header__text">
            <h1 className="channel-header__name">{channel.name}</h1>
            <p className="channel-header__handle">@{channel.handle}</p>
            <p className="channel-header__subs">{formatSubscribers(channel.subscribers)}</p>
          </div>
          <SubscribeButton channelId={channel.id} />
        </div>
      </header>

      <dl className="stat-row">
        <div>
          <dt>Joined</dt>
          <dd>{formatDate(channel.joined)}</dd>
        </div>
        <div>
          <dt>Videos</dt>
          <dd>{channelVideos.length}</dd>
        </div>
        <div>
          <dt>Channel views</dt>
          <dd>{channel.channelViews.toLocaleString('en-US')}</dd>
        </div>
        <div>
          <dt>Videos watched</dt>
          <dd>{channel.videosWatched.toLocaleString('en-US')}</dd>
        </div>
      </dl>

      <nav className="tabs" aria-label="Channel sections">
        {TABS.map((entry) => (
          <Link
            key={entry}
            to={tabHref(entry)}
            className={`tabs__tab${tab === entry ? ' is-active' : ''}`}
            aria-current={tab === entry ? 'page' : undefined}
          >
            {tabLabels[entry]}
          </Link>
        ))}
      </nav>

      {tab === 'videos' ? (
        channelVideos.length === 0 ? (
          <EmptyState title="No videos yet">
            <p>
              This channel has not uploaded anything.{' '}
              <Link to="/channels">Browse other channels</Link>.
            </p>
          </EmptyState>
        ) : (
          <>
            <p className="meta results-count">
              Newest first. {channelVideos.length}{' '}
              {plural(channelVideos.length, 'video')}.
            </p>
            <div className="video-grid">
              {channelVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </>
        )
      ) : null}

      {tab === 'playlists' ? (
        channelPlaylists.length === 0 ? (
          <EmptyState title="No playlists here">
            <p>
              None of your playlists contain a video from this channel yet.{' '}
              <Link to="/playlists">Manage playlists</Link>.
            </p>
          </EmptyState>
        ) : (
          <ul className="playlist-index">
            {channelPlaylists.map((playlist) => (
              <li key={playlist.id}>
                <Link to={`/playlists?list=${playlist.id}`}>{playlist.name}</Link>
                <span className="meta">
                  {' '}
                  · {playlist.videoIds.length}{' '}
                  {plural(playlist.videoIds.length, 'video')}
                </span>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {tab === 'subscribers' ? (
        <section className="panel">
          <h2 className="box__title">{formatSubscribers(channel.subscribers)}</h2>
          <p>
            Individual subscriber lists are private, as they were on the original
            site. This count is a sample figure for the demo catalog.
          </p>
          {channel.id === 'me' ? (
            <p className="meta">
              Your local profile has no subscribers yet because there is no server to
              record them.
            </p>
          ) : null}
        </section>
      ) : null}

      {tab === 'about' ? (
        <section className="panel">
          <h2 className="box__title">About {channel.name}</h2>
          <p className="prose-block">{channel.bio}</p>
          <dl className="about-list">
            <div>
              <dt>Country</dt>
              <dd>{channel.country}</dd>
            </div>
            <div>
              <dt>Website</dt>
              <dd>{channel.website || 'Not set'}</dd>
            </div>
            <div>
              <dt>Joined</dt>
              <dd>{formatDate(channel.joined)}</dd>
            </div>
          </dl>
          <p className="meta">
            Fictional channel created for this open-source demo. Any resemblance to a
            real creator is unintended.
          </p>
        </section>
      ) : null}
    </>
  );
}
