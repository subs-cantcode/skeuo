import { describe, expect, it } from 'vitest';
import { pageTokens, paginate, parsePage } from './pagination';

const items = Array.from({ length: 25 }, (_, index) => index + 1);

describe('paginate', () => {
  it('slices the requested page', () => {
    const result = paginate(items, 2, 10);
    expect(result.items).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect(result.pageCount).toBe(3);
    expect(result.total).toBe(25);
  });

  it('clamps an out-of-range page to the last page instead of showing nothing', () => {
    const result = paginate(items, 99, 10);
    expect(result.page).toBe(3);
    expect(result.items).toEqual([21, 22, 23, 24, 25]);
  });

  it('treats a zero page as the first page', () => {
    expect(paginate(items, 0, 10).page).toBe(1);
  });
});

describe('pageTokens', () => {
  it('lists every page when there are few', () => {
    expect(pageTokens(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('inserts gaps around the current page', () => {
    expect(pageTokens(6, 20)).toEqual([1, 'gap', 5, 6, 7, 'gap', 20]);
  });
});

describe('parsePage', () => {
  it('rejects junk and negative values', () => {
    expect(parsePage('3')).toBe(3);
    expect(parsePage('abc')).toBe(1);
    expect(parsePage('-4')).toBe(1);
    expect(parsePage(null)).toBe(1);
  });
});
