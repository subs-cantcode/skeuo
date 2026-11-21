import { describe, expect, it } from 'vitest';
import {
  coverRect,
  hasRoomFor,
  isQuotaError,
  LibraryError,
  libraryEntryToVideo,
  libraryFileProblems,
  pickPosterTime,
  storageFailureMessage,
  titleFromFileName,
  UNKNOWN_STORAGE,
} from './library';

const file = (overrides: Partial<{ name: string; type: string; size: number }> = {}) => ({
  name: 'clip.mp4',
  type: 'video/mp4',
  size: 1024,
  ...overrides,
});

describe('libraryFileProblems', () => {
  it('accepts the formats browsers can usually decode', () => {
    for (const [name, type] of [
      ['a.mp4', 'video/mp4'],
      ['b.webm', 'video/webm'],
      ['c.ogv', 'video/ogg'],
      ['d.mov', 'video/quicktime'],
    ]) {
      expect(libraryFileProblems(file({ name, type }))).toEqual([]);
    }
  });

  it('falls back to the extension when the browser reports no MIME type', () => {
    expect(libraryFileProblems(file({ name: 'holiday.MP4', type: '' }))).toEqual([]);
  });

  it('rejects non-video files', () => {
    const problems = libraryFileProblems(file({ name: 'notes.txt', type: 'text/plain' }));
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/not a video file/i);
  });

  it('rejects empty and oversized files', () => {
    expect(libraryFileProblems(file({ size: 0 }))[0]).toMatch(/empty/i);
    const huge = libraryFileProblems(file({ size: 900 * 1024 * 1024 }));
    expect(huge[0]).toMatch(/limit is/i);
  });
});

describe('titleFromFileName', () => {
  it('drops the extension and tidies separators', () => {
    expect(titleFromFileName('garden_tour_2009.mp4')).toBe('garden tour 2009');
    expect(titleFromFileName('  clip  .webm')).toBe('clip');
  });

  it('never returns an empty title', () => {
    expect(titleFromFileName('.mp4')).toBe('Untitled video');
  });
});

describe('pickPosterTime', () => {
  it('takes a frame one second in, or a quarter through short clips', () => {
    expect(pickPosterTime(40)).toBe(1);
    expect(pickPosterTime(2)).toBe(0.5);
    expect(pickPosterTime(0.4)).toBeCloseTo(0.1);
  });

  it('returns zero when the duration is unusable', () => {
    expect(pickPosterTime(0)).toBe(0);
    expect(pickPosterTime(Number.NaN)).toBe(0);
  });
});

describe('coverRect', () => {
  it('keeps a 16:9 frame whole', () => {
    expect(coverRect(1280, 720, 640, 360)).toEqual({ sx: 0, sy: 0, sw: 1280, sh: 720 });
  });

  it('crops the top and bottom of a 4:3 frame instead of stretching it', () => {
    const rect = coverRect(640, 480, 640, 360);
    expect(rect.sw).toBe(640);
    expect(rect.sh).toBe(360);
    expect(rect.sy).toBe(60);
    expect(rect.sx).toBe(0);
  });

  it('crops the top and bottom of a portrait frame', () => {
    const rect = coverRect(720, 1280, 640, 360);
    expect(rect.sw).toBe(720);
    expect(rect.sh).toBe(405);
    expect(rect.sx).toBe(0);
    expect(rect.sy).toBeCloseTo(437.5);
  });

  it('reports an empty rectangle for unusable dimensions', () => {
    expect(coverRect(0, 0, 640, 360)).toEqual({ sx: 0, sy: 0, sw: 0, sh: 0 });
  });
});

describe('quota handling', () => {
  it('recognises quota failures from name or message', () => {
    expect(isQuotaError({ name: 'QuotaExceededError' })).toBe(true);
    expect(isQuotaError(new Error('The quota has been exceeded.'))).toBe(true);
    expect(isQuotaError(new Error('Something else'))).toBe(false);
    expect(isQuotaError(null)).toBe(false);
  });

  it('turns a quota failure into advice the user can act on', () => {
    expect(storageFailureMessage({ name: 'QuotaExceededError' })).toMatch(/out of storage/i);
    expect(storageFailureMessage(new LibraryError('Nope.', 'Try again.'))).toBe('Nope. Try again.');
  });

  it('treats an unknown quota as room available and a tight one as full', () => {
    expect(hasRoomFor(50 * 1024 * 1024, null)).toBe(true);
    expect(hasRoomFor(50 * 1024 * 1024, UNKNOWN_STORAGE)).toBe(true);
    expect(
      hasRoomFor(50 * 1024 * 1024, {
        supported: true,
        usage: 40 * 1024 * 1024,
        quota: 60 * 1024 * 1024,
        persisted: false,
      }),
    ).toBe(false);
  });
});

describe('libraryEntryToVideo', () => {
  it('keeps the object URLs and marks the video as local', () => {
    const video = libraryEntryToVideo({
      id: 'local-1',
      title: 'Garden tour',
      description: 'A walk around the beds.',
      fileName: 'garden.mp4',
      mimeType: 'video/mp4',
      sizeBytes: 4096,
      durationSec: 36.6,
      width: 1280,
      height: 720,
      importedAt: '2026-11-21T10:00:00.000Z',
      thumbSeed: 2010,
      src: 'blob:clip',
      thumbnail: 'blob:poster',
    });

    expect(video.id).toBe('local-1');
    expect(video.local).toBe(true);
    expect(video.src).toBe('blob:clip');
    expect(video.thumbnail).toBe('blob:poster');
    expect(video.durationSec).toBe(37);
    expect(video.width).toBe(1280);
    expect(video.channelId).toBe('library');
    expect(video.demo).toBeUndefined();
  });
});
