import { Link } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { EmptyState } from '../components/EmptyState';
import { SidebarBox } from '../components/SidebarBox';
import { SubscribeButton } from '../components/SubscribeButton';
import { VideoCard } from '../components/VideoCard';
import { formatSubscribers, plural } from '../lib/format';
import { sortVideos } from '../lib/sort';
import { dayKey, dayLabel } from '../lib/stats';
import { usePageTitle } from '../lib/usePageTitle';
import { useStore } from '../store/AppStore';
import type { Video } from '../types';

export function SubscriptionsPage() {
  usePageTitle('Subscriptions');
  const { profile, channels, subscriptions, videos } = useStore();

  if (!profile) {
    return (
      <>
        <h1 className="page-title">Subscriptions</h1>
        <div className="panel panel--narrow">
          <p>
            Subscriptions are per account. Sign in with a local profile to follow
            channels and keep a feed of their uploads.
          </p>
          <p className="panel__actions">
            <Link
              className="button button--primary"
              to="/signin?next=%2Fsubscriptions"
            >
              Sign in
            </Link>
          </p>
        </div>
      </>
    );
  }

  const subscribedChannels = channels.filter((channel) =>
    subscriptions.includes(channel.id),
  );
  const feed = sortVideos(
    videos.filter((video) => subscriptions.includes(video.channelId)),
    'newest',
  );

  const groups: Array<{ key: string; label: string; videos: Video[] }> = [];
  for (const video of feed) {
    const key = dayKey(video.uploadedAt);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.videos.push(video);
    else groups.push({ key, label: dayLabel(video.uploadedAt), videos: [video] });
  }

  return (
    <div className="two-column">
      <div>
        <div className="breadcrumb">
          <Link to="/">Home</Link> <span aria-hidden="true">›</span> Subscriptions
        </div>
        <h1 className="page-title">Subscriptions</h1>
        <p className="lede">
          Uploads from channels you follow, newest first. No ranking, no sponsored
          slots, no unrelated suggestions.
        </p>

        {subscribedChannels.length === 0 ? (
          <EmptyState title="You are not subscribed to anything yet">
            <p>
              <Link to="/channels">Browse channels</Link> and press Subscribe. New
              uploads from those channels will appear here in strict date order.
            </p>
          </EmptyState>
        ) : feed.length === 0 ? (
          <EmptyState title="No uploads yet">
            <p>
              You follow {subscribedChannels.length}{' '}
              {plural(subscribedChannels.length, 'channel')}, but none has uploaded a
              video. Nothing is hidden from this feed.
            </p>
          </EmptyState>
        ) : (
          groups.map((group) => (
            <section key={group.key} className="feed-day" aria-labelledby={`day-${group.key}`}>
              <h2 id={`day-${group.key}`} className="feed-day__heading">
                {group.label}
              </h2>
              <ul className="feed-list">
                {group.videos.map((video) => (
                  <li key={video.id}>
                    <VideoCard video={video} variant="row" />
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>

      <aside aria-label="Channels you follow">
        <SidebarBox title={`Channels you follow (${subscribedChannels.length})`}>
          {subscribedChannels.length === 0 ? (
            <p className="box__note">
              <Link to="/channels">Find channels</Link> to follow.
            </p>
          ) : (
            <ul className="follow-list">
              {subscribedChannels.map((channel) => (
                <li key={channel.id} className="follow-list__item">
                  <Link to={`/channel/${channel.id}`} className="follow-list__identity">
                    <Avatar name={channel.name} color={channel.themeColor} size="small" />
                    <span>
                      <span className="follow-list__name">{channel.name}</span>
                      <span className="meta">
                        {formatSubscribers(channel.subscribers)}
                      </span>
                    </span>
                  </Link>
                  <SubscribeButton channelId={channel.id} small />
                </li>
              ))}
            </ul>
          )}
        </SidebarBox>
      </aside>
    </div>
  );
}
