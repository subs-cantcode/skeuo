import type { Channel, Video } from '../types';
import { sortVideos } from './sort';

/**
 * One card per video id, first occurrence wins. Drafts, the local library and
 * the catalog are concatenated upstream, so the same id can reach a list twice
 * (for example a local draft that is also stored in the library). Lists must
 * never show a video twice.
 */
export function dedupeVideosById(videos: Video[]): Video[] {
  const seen = new Set<string>();
  const unique: Video[] = [];
  for (const video of videos) {
    if (seen.has(video.id)) continue;
    seen.add(video.id);
    unique.push(video);
  }
  return unique;
}

/** Older uploads could create multiple ids pointing at the very same local
 * object URL. Collapse those in rails without deleting stored videos or
 * mistaking demo videos (which intentionally share sample URLs) for duplicates. */
function railVideos(videos: Video[], current?: Video): Video[] {
  const localSource = (video: Video) =>
    (video.local || video.localDraft) && video.src.startsWith('blob:')
      ? `${video.channelId}:${video.src}`
      : undefined;
  const seen = new Set<string>();
  const currentSource = current && localSource(current);
  return dedupeVideosById(videos).filter(video => {
    if (video.id === current?.id) return false;
    const source = localSource(video);
    if (!source) return true;
    if (source === currentSource || seen.has(source)) return false;
    seen.add(source);
    return true;
  });
}

/**
 * Deterministic, explainable related-video ordering: same channel, then same
 * category, then shared tags, then view count. No personalisation data is used.
 * The video being watched is never related to itself.
 */
export function relatedVideos(
  current: Video,
  videos: Video[],
  limit = 10,
): Video[] {
  const tags = new Set(current.tags.map((tag) => tag.toLowerCase()));
  return railVideos(videos, current)
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

/**
 * Newest uploads from the same channel. `currentId` keeps the video being
 * watched out of its own "More From" rail: it is already on the page.
 */
export function moreFromChannel(
  channel: Channel,
  videos: Video[],
  limit = 6,
  currentId?: string,
): Video[] {
  return sortVideos(
    railVideos(videos, videos.find(video => video.id === currentId)).filter(
      (video) => video.channelId === channel.id && video.id !== currentId,
    ),
    'newest',
  ).slice(0, limit);
}
