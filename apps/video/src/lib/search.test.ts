import { describe, expect, it } from 'vitest';
import { CHANNELS } from '../data/channels';
import { VIDEOS } from '../data/videos';
import { searchVideos } from './search';

const options = { videos: VIDEOS, channels: CHANNELS };

describe('searchVideos', () => {
  it('matches a title', () => {
    const result = searchVideos(options, { q: 'harbour lights' });
    expect(result.items[0]?.id).toBe('v-harbour');
  });

  it('matches a channel name', () => {
    const result = searchVideos(options, { q: 'workbench' });
    expect(result.total).toBeGreaterThan(0);
    expect(result.items.every((video) => video.channelId === 'workbench')).toBe(true);
  });

  it('matches a tag', () => {
    const result = searchVideos(options, { q: 'lighthouses' });
    expect(result.items.map((video) => video.id)).toEqual(['v-lighthouse']);
  });

  it('sorts by views and by date', () => {
    const byViews = searchVideos(options, { sort: 'views', pageSize: 3 });
    expect(byViews.items[0].views).toBeGreaterThanOrEqual(byViews.items[1].views);

    const newest = searchVideos(options, { sort: 'newest', pageSize: 3 });
    expect(Date.parse(newest.items[0].uploadedAt)).toBeGreaterThanOrEqual(
      Date.parse(newest.items[1].uploadedAt),
    );

    const oldest = searchVideos(options, { sort: 'oldest', pageSize: 3 });
    expect(Date.parse(oldest.items[0].uploadedAt)).toBeLessThanOrEqual(
      Date.parse(oldest.items[1].uploadedAt),
    );
  });

  it('filters by category and returns everything without a query', () => {
    const result = searchVideos(options, { category: 'Comedy', pageSize: 50 });
    expect(result.total).toBeGreaterThan(0);
    expect(result.items.every((video) => video.category === 'Comedy')).toBe(true);

    const all = searchVideos(options, { pageSize: 100 });
    expect(all.total).toBe(VIDEOS.length);
  });

  it('returns an empty result for an unmatched query', () => {
    const result = searchVideos(options, { q: 'zzzz-no-such-term' });
    expect(result.total).toBe(0);
    expect(result.items).toEqual([]);
  });

  it('paginates results', () => {
    const first = searchVideos(options, { page: 1, pageSize: 5 });
    const second = searchVideos(options, { page: 2, pageSize: 5 });
    expect(first.items).toHaveLength(5);
    expect(first.items[0].id).not.toBe(second.items[0].id);
  });
});
