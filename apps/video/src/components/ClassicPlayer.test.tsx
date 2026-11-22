import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ClassicPlayer, playerTime } from './ClassicPlayer';

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

function mount() {
  const ended = vi.fn();
  const result = render(<ClassicPlayer src="blob:clip" poster="poster.jpg" title="Local clip" onEnded={ended} />);
  const video = result.container.querySelector('video')!;
  Object.defineProperty(video, 'duration', { configurable: true, value: 125 });
  return { ...result, video, ended };
}

describe('ClassicPlayer', () => {
  it('uses actual media duration, provides inline playback, and starts without native controls', () => {
    const { video } = mount();
    expect(video).toHaveAttribute('playsinline');
    expect(video).not.toHaveAttribute('controls');
    expect(screen.getByRole('slider', { name: 'Seek video' })).toBeDisabled();
    fireEvent.loadedMetadata(video);
    expect(screen.getByRole('slider', { name: 'Seek video' })).toHaveAttribute('max', '125');
    expect(screen.getByLabelText('Playback time')).toHaveTextContent('0:00 / 2:05');
  });

  it('derives play/pause state from media events and calls the actual element', async () => {
    const { video } = mount();
    await userEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(video.play).toHaveBeenCalledOnce();
    fireEvent.play(video);
    Object.defineProperty(video, 'paused', { value: false, configurable: true });
    await userEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(video.pause).toHaveBeenCalledOnce();
    fireEvent.pause(video);
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
  });

  it('handles rejected playback without a false playing state or unhandled rejection', async () => {
    const { video } = mount();
    vi.mocked(video.play).mockRejectedValue(new DOMException('Blocked', 'NotAllowedError'));
    await userEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(screen.getByRole('status')).toHaveTextContent('Playback could not start');
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
  });

  it('does not start another pending play request for an already failed source', async () => {
    const { video } = mount();
    fireEvent.error(video.querySelector('source')!);
    await userEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(video.play).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('could not be loaded or decoded');
    fireEvent.loadedMetadata(video);
    await userEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(video.play).toHaveBeenCalledOnce();
  });

  it('seeks, keeps timestamps in sync, and treats unknown duration safely', () => {
    const { video } = mount();
    fireEvent.loadedMetadata(video);
    fireEvent.change(screen.getByRole('slider', { name: 'Seek video' }), { target: { value: '65' } });
    expect(video.currentTime).toBe(65);
    expect(screen.getByLabelText('Playback time')).toHaveTextContent('1:05 / 2:05');
    Object.defineProperty(video, 'duration', { value: Infinity, configurable: true });
    fireEvent.durationChange(video);
    expect(screen.getByRole('slider', { name: 'Seek video' })).toBeDisabled();
    expect(screen.getByLabelText('Playback time')).toHaveTextContent('--:--');
  });

  it('sets volume and mute, including recovery from zero volume', async () => {
    const { video } = mount();
    fireEvent.change(screen.getByRole('slider', { name: 'Volume' }), { target: { value: '0.25' } });
    expect(video.volume).toBe(0.25);
    await userEvent.click(screen.getByRole('button', { name: 'Mute' }));
    expect(video.muted).toBe(true);
    expect(screen.getByRole('button', { name: 'Unmute' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.change(screen.getByRole('slider', { name: 'Volume' }), { target: { value: '0' } });
    await userEvent.click(screen.getByRole('button', { name: 'Unmute' }));
    expect(video.volume).toBeGreaterThan(0);
    expect(video.muted).toBe(false);
  });

  it('unmutes a zero-volume video returned from native controls', async () => {
    const { video } = mount();
    await act(async () => {
      video.volume = 0;
      video.muted = false;
      fireEvent.volumeChange(video);
    });
    await userEvent.click(screen.getByRole('button', { name: 'Unmute' }));
    expect(video.volume).toBeGreaterThan(0);
    expect(video.muted).toBe(false);
  });

  it('keeps shortcuts local and leaves focused native controls alone', () => {
    const { video } = mount();
    fireEvent.loadedMetadata(video);
    const group = screen.getByRole('group', { name: 'Local clip video player' });
    fireEvent.keyDown(group, { key: 'ArrowRight' });
    expect(video.currentTime).toBe(5);
    fireEvent.keyDown(group, { key: 'ArrowLeft' });
    expect(video.currentTime).toBe(0);
    fireEvent.keyDown(group, { key: 'End' });
    expect(video.currentTime).toBe(125);
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Seek video' }), { key: 'ArrowLeft' });
    expect(video.currentTime).toBe(125);
    fireEvent.keyDown(document.body, { key: 'k' });
    expect(video.play).not.toHaveBeenCalled();
    fireEvent.keyDown(group, { key: 'k' });
    expect(video.play).toHaveBeenCalledOnce();
  });

  it('preserves the playlist ended callback and offers native control fallback', async () => {
    const { video, ended } = mount();
    fireEvent.ended(video);
    expect(ended).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole('button', { name: 'Use device controls' }));
    expect(video).toHaveAttribute('controls');
    expect(screen.queryByRole('slider', { name: 'Seek video' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Use classic controls' }));
    expect(video).not.toHaveAttribute('controls');
  });

  it('uses the Safari video fullscreen API when wrapper fullscreen is unavailable', async () => {
    const { video } = mount();
    const enter = vi.fn();
    Object.defineProperty(video, 'webkitEnterFullscreen', { value: enter });
    await userEvent.click(screen.getByRole('button', { name: 'Enter fullscreen' }));
    expect(enter).toHaveBeenCalledOnce();
  });

  it('explains fullscreen failure and enables native controls', async () => {
    const { video } = mount();
    await userEvent.click(screen.getByRole('button', { name: 'Enter fullscreen' }));
    expect(video).toHaveAttribute('controls');
    expect(screen.getByRole('status')).toHaveTextContent('Fullscreen is unavailable');
  });

  it('resets playback state when the source changes', () => {
    const { video, rerender } = mount();
    fireEvent.play(video);
    rerender(<ClassicPlayer src="blob:another" poster="poster.jpg" title="Another clip" />);
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
    expect(screen.getByLabelText('Playback time')).toHaveTextContent('0:00 / --:--');
  });
});

it('formats long and invalid media times without wrapping or NaN', () => {
  expect(playerTime(3661.7)).toBe('1:01:01');
  expect(playerTime(Infinity)).toBe('0:00');
  expect(playerTime(-1)).toBe('0:00');
});
