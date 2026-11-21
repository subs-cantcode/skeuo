import type { Channel, Video } from '../types';
import { sortVideos } from './sort';

/**
 * Deterministic, explainable related-video ordering: same channel, then same
 * category, then shared tags, then view count. No personalisation data is used.
 */
export function relatedVideos(
  current: Video,
  videos: Video[],
  limit = 10,
): Video[] {
  const tags = new Set(current.tags.map((tag) => tag.toLowerCase()));
  return videos
    .filter((video) => video.id !== current.id)
    .map((video) => {
      const sharedTags = video.tags.filter((tag) => tags.has(tag.toLowerCase())).length;
      const score =
        (video.channelId === current.channelId ? 8 : 0) +
        (video.category === current.category ? 4 : 0) +
        Math.min(sharedTags, 4);
      return { video, score };
    })
    .sort((a, b) => b.score - a.score || b.video.views - a.video.views)
    .slice(0, limit)
    .map((entry) => entry.video);
}

export function moreFromChannel(
  channel: Channel,
  videos: Video[],
  limit = 6,
): Video[] {
  return sortVideos(
    videos.filter((video) => video.channelId === channel.id),
    'newest',
  ).slice(0, limit);
}
