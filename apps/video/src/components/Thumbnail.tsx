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
 * 16:9 artwork with the era's black duration chip. Decorative: the surrounding
 * link carries the accessible name.
 *
 * A video uses its real extracted frame when `thumbnail` is set; every other
 * video keeps the original generated SVG artwork. If a frame image fails to
 * load, the generated artwork takes over so a card never shows a broken image.
 */
export function Thumbnail({ video, tint, size = 'grid' }: ThumbnailProps) {
  const fallback = thumbnailDataUri(video.thumbSeed, tint);

  return (
    <span className={`thumb thumb--${size}`}>
      <img
        src={video.thumbnail ?? fallback}
        onError={(event) => {
          const img = event.currentTarget;
          if (img.dataset.fallbackApplied) return;
          img.dataset.fallbackApplied = 'true';
          img.src = fallback;
        }}
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
