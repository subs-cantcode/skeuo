import { Link } from 'react-router-dom';
import { channelName, channelTint } from '../lib/channel';
import { formatShortDate, formatViews, relativeTime } from '../lib/format';
import { useStore } from '../store/AppStore';
import type { Video } from '../types';
import { Thumbnail } from './Thumbnail';

type Variant = 'grid' | 'row' | 'compact' | 'feature';

interface VideoCardProps {
  video: Video;
  variant?: Variant;
}

function Meta({ video, name }: { video: Video; name: string }) {
  return (
    <p className="video-card__meta">
      <Link to={`/channel/${video.channelId}`} className="video-card__channel">
        {name}
      </Link>
      <span aria-hidden="true"> · </span>
      <span>{relativeTime(video.uploadedAt)}</span>
      <span aria-hidden="true"> · </span>
      <span>{formatViews(video.views)}</span>
    </p>
  );
}

/** A video anywhere in Skeuo Video: grid tile, result row, or rail entry. */
export function VideoCard({ video, variant = 'grid' }: VideoCardProps) {
  const { getChannel } = useStore();
  const channel = getChannel(video.channelId);
  const name = channelName(channel);
  const watchPath = `/watch/${video.id}`;
  const size = variant === 'row' ? 'row' : variant === 'compact' ? 'compact' : 'grid';
  const titleSuffix =
    variant === 'compact'
      ? ' video-card__title--small'
      : variant === 'feature'
        ? ' video-card__title--feature'
        : '';

  const thumb = (
    <Link to={watchPath} className="video-card__thumb-link" aria-label={video.title}>
      <Thumbnail video={video} tint={channelTint(channel)} size={size} />
    </Link>
  );
  const title = (
    <h3 className={`video-card__title${titleSuffix}`}>
      <Link to={watchPath}>{video.title}</Link>
    </h3>
  );

  if (variant === 'row') {
    return (
      <article className="video-card video-card--row">
        {thumb}
        <div className="video-card__body">
          {title}
          <p className="video-card__snippet">{video.description}</p>
          <Meta video={video} name={name} />
          <p className="video-card__tagline">
            Added {formatShortDate(video.uploadedAt)} · {video.category}
          </p>
        </div>
      </article>
    );
  }

  if (variant === 'compact') {
    return (
      <article className="video-card video-card--compact">
        {thumb}
        <div className="video-card__body">
          {title}
          <p className="video-card__meta video-card__meta--tight">
            <Link to={`/channel/${video.channelId}`}>{name}</Link>
            <span aria-hidden="true"> · </span>
            {formatViews(video.views)}
          </p>
        </div>
      </article>
    );
  }

  if (variant === 'feature') {
    return (
      <article className="video-card video-card--feature">
        {thumb}
        {title}
        <p className="video-card__snippet">{video.description}</p>
        <Meta video={video} name={name} />
      </article>
    );
  }

  return (
    <article className="video-card video-card--grid">
      {thumb}
      {title}
      <Meta video={video} name={name} />
    </article>
  );
}
