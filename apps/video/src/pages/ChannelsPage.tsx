import { Link } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { SubscribeButton } from '../components/SubscribeButton';
import { formatSubscribers, plural } from '../lib/format';
import { usePageTitle } from '../lib/usePageTitle';
import { useStore } from '../store/AppStore';

export function ChannelsPage() {
  usePageTitle('Channels');
  const { channels, videos, isSubscribed } = useStore();

  return (
    <>
      <div className="breadcrumb">
        <Link to="/">Home</Link> <span aria-hidden="true">›</span> Channels
      </div>
      <h1 className="page-title">Channels</h1>
      <p className="lede">
        Every channel in the library, with nothing promoted above the others.
        Subscribing adds their uploads to a chronological feed.
      </p>

      <ul className="channel-list">
        {channels.map((channel) => {
          const count = videos.filter((video) => video.channelId === channel.id).length;
          return (
            <li key={channel.id} className="channel-list__item">
              <Link to={`/channel/${channel.id}`} className="channel-list__identity">
                <Avatar name={channel.name} color={channel.themeColor} size="large" />
                <span>
                  <span className="channel-list__name">{channel.name}</span>
                  <span className="channel-list__handle">@{channel.handle}</span>
                  <span className="meta">
                    Joined {new Date(channel.joined).getFullYear()} ·{' '}
                    {formatSubscribers(channel.subscribers)} · {count} {plural(count, 'video')}
                  </span>
                </span>
              </Link>
              <div className="channel-list__actions">
                <SubscribeButton channelId={channel.id} small />
                {isSubscribed(channel.id) ? (
                  <span className="meta channel-list__status">Subscribed</span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
