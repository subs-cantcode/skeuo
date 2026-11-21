import { formatDuration } from '../lib/format';
import { thumbnailDataUri } from '../lib/thumbnails';
import type { Video } from '../types';

interface ThumbnailProps {
  video: Video;
  tint: string;
  /** Compact thumbnails are 96px wide; rows use 120px; grids fill their cell. */
  size?: 'grid' | 'row' | 'compact';
}

/**
 * Generated 16:9 artwork with the era's black duration chip. Decorative: the
 * surrounding link carries the accessible name.
 *
 * Artwork is original SVG built at runtime for Skeuo Video; no frames, photos,
 * or third-party artwork are included.
 */
export function Thumbnail({ video, tint, size = 'grid' }: ThumbnailProps) {
  return (
    <span className={`thumb thumb--${size}`}>
      <img
        src={thumbnailDataUri(video.thumbSeed, tint)}
        alt=""
        width={320}
        height={180}
        loading="lazy"
        decoding="async"
      />
      <span className="thumb__duration">{formatDuration(video.durationSec)}</span>
    </span>
  );
}
