import { describe, expect, it } from 'vitest';
import type { Channel, Video } from '../types';
import { dedupeVideosById, moreFromChannel, relatedVideos } from './related';

const video = (overrides: Partial<Video> = {}): Video => ({
  id: 'v-1',
  title: 'Clip',
  description: '',
  channelId: 'backlot',
  category: 'Comedy',
  tags: [],
  durationSec: 60,
  views: 100,
  uploadedAt: '2026-01-01T00:00:00.000Z',
  src: '',
  thumbSeed: 1,
  ...overrides,
});

const channel = (id: string): Channel => ({
  id,
  name: id,
  handle: id,
  bio: '',
  joined: '2026-01-01',
  country: 'Not set',
  website: '',
  themeColor: '#4a4f57',
  subscribers: 0,
  channelViews: 0,
  videosWatched: 0,
});

describe('dedupeVideosById', () => {
  it('keeps the first copy of each id in order', () => {
    const result = dedupeVideosById([
      video({ id: 'a' }),
      video({ id: 'b' }),
      video({ id: 'a', title: 'duplicate' }),
    ]);
    expect(result.map((entry) => entry.id)).toEqual(['a', 'b']);
    expect(result[0].title).toBe('Clip');
  });

  it('leaves a list without duplicates untouched', () => {
    const list = [video({ id: 'a' }), video({ id: 'b' })];
    expect(dedupeVideosById(list)).toHaveLength(2);
  });
});

describe('relatedVideos', () => {
  it('never relates a video to itself', () => {
    const current = video({ id: 'current' });
    const result = relatedVideos(current, [current, video({ id: 'other' })]);
    expect(result.map((entry) => entry.id)).toEqual(['other']);
  });

  it('shows a repeated id only once', () => {
    const current = video({ id: 'current' });
    const result = relatedVideos(current, [
      video({ id: 'other' }),
      video({ id: 'other' }),
      video({ id: 'third' }),
    ]);
    expect(result.map((entry) => entry.id)).toEqual(['other', 'third']);
  });

  it('still ranks by shared channel, category and tags', () => {
    const current = video({ id: 'current', channelId: 'backlot', category: 'Comedy', tags: ['x'] });
    const result = relatedVideos(current, [
      video({ id: 'same-channel', channelId: 'backlot' }),
      video({ id: 'unrelated', channelId: 'other', category: 'Sports' }),
    ]);
    expect(result[0].id).toBe('same-channel');
  });
});

describe('moreFromChannel', () => {
  it('excludes the video being watched', () => {
    const result = moreFromChannel(channel('backlot'), [
      video({ id: 'current' }),
      video({ id: 'sibling' }),
    ], 5, 'current');
    expect(result.map((entry) => entry.id)).toEqual(['sibling']);
  });

  it('shows a repeated id only once', () => {
    const result = moreFromChannel(
      channel('backlot'),
      [video({ id: 'a' }), video({ id: 'a' }), video({ id: 'b' })],
      5,
      'current',
    );
    expect(result.map((entry) => entry.id)).toEqual(['a', 'b']);
  });

  it('only returns videos from the requested channel', () => {
    const result = moreFromChannel(channel('backlot'), [
      video({ id: 'mine', channelId: 'backlot' }),
      video({ id: 'theirs', channelId: 'slowcoast' }),
    ]);
    expect(result.map((entry) => entry.id)).toEqual(['mine']);
  });
});
