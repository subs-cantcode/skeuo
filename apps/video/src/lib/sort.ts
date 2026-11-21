import type { Video } from '../types';

/** The only orderings the catalogue offers. No engagement or ranking score. */
export type VideoSort = 'newest' | 'oldest' | 'views';

export const byNewest = (a: Video, b: Video) =>
  Date.parse(b.uploadedAt) - Date.parse(a.uploadedAt);

export const byOldest = (a: Video, b: Video) =>
  Date.parse(a.uploadedAt) - Date.parse(b.uploadedAt);

export const byViews = (a: Video, b: Video) => b.views - a.views;

/** Copy, then order. Callers never mutate the store's array. */
export function sortVideos(videos: Video[], sort: VideoSort): Video[] {
  const compare = sort === 'views' ? byViews : sort === 'oldest' ? byOldest : byNewest;
  return [...videos].sort(compare);
}
