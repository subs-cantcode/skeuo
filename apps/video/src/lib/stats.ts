import type { Video } from '../types';

/** Small stable string hash, used for deterministic mock counters. */
export function hashString(text: string): number {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

export interface VoteCounts {
  likes: number;
  dislikes: number;
}

/**
 * Like/dislike totals for a video. Derived from the view counter and a stable
 * hash so they never jump between renders. These are seeded sample numbers,
 * not real activity; Milestone 2 replaces them with stored votes.
 */
export function voteCounts(video: Video): VoteCounts {
  const hash = hashString(video.id);
  const likes = Math.max(3, Math.round(video.views * 0.031) + (hash % 89));
  const dislikes = Math.max(1, Math.round(likes * 0.026) + (hash % 11));
  return { likes, dislikes };
}

/** Day bucket used to group chronological feeds. */
export function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export function dayLabel(iso: string, now: number = Date.now()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  const today = new Date(now);
  const startOfDay = (value: Date) =>
    Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()) / 86400000;
  const days = startOfDay(today) - startOfDay(date);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
