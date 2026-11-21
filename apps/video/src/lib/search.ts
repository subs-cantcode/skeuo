import type { Category, Channel, Video } from '../types';
import { paginate, type PageResult } from './pagination';
import { byNewest, byOldest, byViews } from './sort';

export type SortKey = 'relevance' | 'newest' | 'oldest' | 'views';

export const SORT_LABELS: Record<SortKey, string> = {
  relevance: 'Relevance',
  newest: 'Newest first',
  oldest: 'Oldest first',
  views: 'Most viewed',
};

export interface SearchParams {
  q?: string;
  sort?: SortKey;
  category?: Category | 'All';
  channelId?: string;
  page?: number;
  pageSize?: number;
}

export interface SearchOptions {
  videos: Video[];
  channels: Channel[];
}

const normalise = (value: string) => value.trim().toLowerCase();

const countOccurrences = (haystack: string, needle: string): number => {
  if (!needle) return 0;
  let count = 0;
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    count += 1;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return count;
};

/**
 * Transparent relevance: no personalisation, no history, no hidden weights.
 * Title matches outrank channel matches, which outrank tags, category and
 * description. Ties fall back to view count.
 */
export function relevanceScore(video: Video, channelName: string, terms: string[]): number {
  const title = normalise(video.title);
  const description = normalise(video.description);
  const channel = normalise(channelName);
  const category = normalise(video.category);
  const tags = normalise(video.tags.join(' '));
  let score = 0;
  for (const term of terms) {
    if (title === term) score += 12;
    score += countOccurrences(title, term) * 6;
    score += countOccurrences(channel, term) * 4;
    score += countOccurrences(tags, term) * 3;
    score += countOccurrences(category, term) * 2;
    score += countOccurrences(description, term);
  }
  return score;
}

export function searchVideos(
  options: SearchOptions,
  params: SearchParams = {},
): PageResult<Video> {
  const { videos, channels } = options;
  const terms = normalise(params.q ?? '').split(/\s+/).filter(Boolean);
  const sort: SortKey = params.sort ?? 'relevance';
  const category = params.category ?? 'All';

  const channelNames = new Map(channels.map((channel) => [channel.id, channel.name]));

  const scored = videos
    .map((video) => ({
      video,
      channelName: channelNames.get(video.channelId) ?? '',
    }))
    .filter((entry) =>
      (category === 'All' || entry.video.category === category) &&
      (!params.channelId || entry.video.channelId === params.channelId)
    )
    .map((entry) => ({
      video: entry.video,
      channelName: entry.channelName,
      score: terms.length
        ? relevanceScore(entry.video, entry.channelName, terms)
        : 0,
    }))
    .filter(({ score }) => !terms.length || score > 0);

  const stableTie = (a: typeof scored[number], b: typeof scored[number]) =>
    b.video.views - a.video.views || a.video.uploadedAt.localeCompare(b.video.uploadedAt);

  const compare =
    sort === 'newest' ? byNewest : sort === 'oldest' ? byOldest : sort === 'views' ? byViews : null;
  scored.sort((a, b) =>
    compare ? compare(a.video, b.video) : b.score - a.score || stableTie(a, b),
  );

  return paginate(
    scored.map((entry) => entry.video),
    params.page ?? 1,
    params.pageSize ?? 20,
  );
}
