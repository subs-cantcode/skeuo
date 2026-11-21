/** Formatting helpers. Counts follow the 2009 convention: commas, not "1.2K". */

export function formatCount(value: number): string {
  return Math.max(0, Math.round(value)).toLocaleString('en-US');
}

export function formatViews(value: number): string {
  return `${formatCount(value)} ${plural(value, 'view')}`;
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

/** "3 days ago", "2 weeks ago", "just now". `now` is injectable for tests. */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Math.max(0, Math.floor((now - then) / 1000));
  if (diff < 45) return 'just now';
  for (const [unit, seconds] of RELATIVE_UNITS) {
    if (diff >= seconds) {
      const value = Math.floor(diff / seconds);
      return `${value} ${unit}${value === 1 ? '' : 's'} ago`;
    }
  }
  return 'just now';
}

export function formatSubscribers(value: number): string {
  return `${formatCount(value)} ${plural(value, 'subscriber')}`;
}

/** "1 video" / "3 videos"; pass the plural for irregular words. */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return count === 1 ? singular : pluralForm;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
