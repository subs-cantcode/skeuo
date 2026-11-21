export interface PageResult<T> {
  items: T[];
  page: number;
  pageCount: number;
  total: number;
}

/**
 * Clamp and slice. Page numbers are 1-based; an out-of-range page clamps to
 * the last page rather than showing an empty screen.
 */
export function paginate<T>(items: T[], page: number, pageSize: number): PageResult<T> {
  const size = Math.max(1, Math.floor(pageSize));
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / size));
  const safePage = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  const start = (safePage - 1) * size;
  return { items: items.slice(start, start + size), page: safePage, pageCount, total };
}

export type PageToken = number | 'gap';

/** Build a compact page list: 1 … 4 5 [6] 7 8 … 20 */
export function pageTokens(current: number, pageCount: number): PageToken[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const tokens: PageToken[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(pageCount - 1, current + 1);
  if (start > 2) tokens.push('gap');
  for (let page = start; page <= end; page += 1) tokens.push(page);
  if (end < pageCount - 1) tokens.push('gap');
  tokens.push(pageCount);
  return tokens;
}

export function parsePage(value: string | null): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1;
}
