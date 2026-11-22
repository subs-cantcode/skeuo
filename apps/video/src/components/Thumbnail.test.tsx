import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Video } from '../types';
import { Thumbnail } from './Thumbnail';

const video = (overrides: Partial<Video> = {}): Video => ({
  id: 'v-1',
  title: 'Clip',
  description: '',
  channelId: 'backlot',
  category: 'Comedy',
  tags: [],
  durationSec: 65,
  views: 10,
  uploadedAt: '2026-01-01T00:00:00.000Z',
  src: '',
  thumbSeed: 1234,
  ...overrides,
});

const image = (container: HTMLElement) => container.querySelector('img') as HTMLImageElement;

describe('Thumbnail', () => {
  it('uses the captured frame when the video has one', () => {
    const { container } = render(
      <Thumbnail video={video({ thumbnail: 'blob:poster' })} tint="#4a4f57" />,
    );
    expect(image(container).getAttribute('src')).toBe('blob:poster');
  });

  it('falls back to the generated artwork when no frame was captured', () => {
    const { container } = render(<Thumbnail video={video()} tint="#4a4f57" />);
    expect(image(container).getAttribute('src')).toMatch(/^data:image\/svg\+xml/);
  });

  it('swaps to the generated artwork when the frame fails to load', () => {
    const { container } = render(
      <Thumbnail video={video({ thumbnail: 'blob:missing' })} tint="#4a4f57" />,
    );
    fireEvent.error(image(container));
    expect(image(container).getAttribute('src')).toMatch(/^data:image\/svg\+xml/);
    expect(image(container).dataset.fallbackApplied).toBe('true');
  });

  it('labels a local video', () => {
    const { container } = render(<Thumbnail video={video({ local: true })} tint="#4a4f57" />);
    expect(container.querySelector('.thumb__badge')?.textContent).toMatch(/Local — Only you/);
  });
});
