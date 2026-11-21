import { describe, expect, it } from 'vitest';
import { CHANNELS } from '../data/channels';
import { VIDEOS } from '../data/videos';
import { searchVideos } from './search';

const options = { videos: VIDEOS, channels: CHANNELS };

describe('searchVideos', () => {
  it('matches a title', () => {
    const result = searchVideos(options, { q: 'harbour' });
    expect(result.items[0]?.id).toBe('v-harbour');
  });

  it('matches a channel name', () => {
    const result = searchVideos(options, { q: 'workbench' });
    expect(result.total).toBeGreaterThan(0);
    expect(result.items.every((video) => video.channelId === 'workbench')).toBe(true);
  });

  it('matches a tag', () => {
    const result = searchVideos(options, { q: 'stairwell' });
    expect(result.items.map((video) => video.id)).toEqual(['v-string-quartet']);
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
    const all = searchVideos(options, { category: 'All', pageSize: 50 });
    expect(all.total).toBe(VIDEOS.length);
  });

  it('handles a category that has no matching videos', () => {
    const result = searchVideos(options, { category: 'Autos & Vehicles', pageSize: 50 });
    expect(result.items.length).toBe(0);
    expect(result.total).toBe(0);
  });

  it('keeps every previously populated category populated', () => {
    const categories = [
      'Film & Animation',
      'Music',
      'How to & Style',
      'Gaming',
      'Science & Technology',
      'News & Politics',
      'Travel & Events',
      'Comedy',
      'Pets & Animals',
      'Education',
      'Sports',
    ] as const;

    for (const category of categories) {
      const result = searchVideos(options, { category, pageSize: 50 });
      expect(result.total, category).toBeGreaterThan(0);
    }
  });

  it('returns all videos for the All category', () => {
    const result = searchVideos(options, { category: 'All', pageSize: 50 });
    expect(result.total).toBe(VIDEOS.length);
    expect(result.items).toHaveLength(VIDEOS.length);
  });

  it('returns an empty result for an unmatched query', () => {
    const result = searchVideos(options, { q: 'zzzz-no-such-term' });
    expect(result.total).toBe(0);
    expect(result.items).toEqual([]);
  });

  it('paginates results with a stable order', () => {
    const page = searchVideos(options, { pageSize: 3 });
    expect(page.items).toHaveLength(3);
    expect(page.total).toBeGreaterThan(3);
    const page2 = searchVideos(options, { page: 2, pageSize: 3 });
    if (page2.items.length > 0) {
      expect(page.items[0].id).not.toBe(page2.items[0].id);
    }
  });
});

describe('catalog integrity', () => {
  it('keeps the 24 demonstration entries and one real sample', () => {
    const demos = VIDEOS.filter((video) => video.demo);
    expect(demos).toHaveLength(24);

    const real = VIDEOS.find((video) => video.id === 'v-mdn-flower');
    expect(real?.demo).toBeUndefined();
    expect(real?.thumbnail).toBe('/thumbnails/flower.webp');
    expect(real?.durationSec).toBe(5);
    expect(real?.attribution).toContain('CC0');
  });

  it('only plays sources that were verified to decode', () => {
    const hosts = new Set(VIDEOS.map((video) => new URL(video.src).host));
    expect([...hosts]).toEqual(['interactive-examples.mdn.mozilla.net']);
  });

  it('claims a real frame only for the entry it was extracted from', () => {
    const withFrames = VIDEOS.filter((video) => video.thumbnail);
    expect(withFrames.map((video) => video.id)).toEqual(['v-mdn-flower']);
    expect(withFrames[0].src).toBe(
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    );
  });
});
