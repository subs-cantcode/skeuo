import { CATEGORIES, type Category } from '../types';

/**
 * Spelling variants that earlier builds, or the 2008 catalogue being imitated,
 * wrote differently. The research notes in docs/historical-research.md quote
 * the old spelling on purpose; stored user data is normalised to today's label
 * instead, without being discarded.
 */
export const CATEGORY_ALIASES: Record<string, Category> = {
  'Howto & Style': 'How to & Style',
  'How-to & Style': 'How to & Style',
  'How To & Style': 'How to & Style',
  'Nonprofits & Activism': 'Non-profit & Activism',
  'Nonprofit & Activism': 'Non-profit & Activism',
  'Non-Profit & Activism': 'Non-profit & Activism',
  'Non Profit & Activism': 'Non-profit & Activism',
};

const KNOWN: readonly string[] = CATEGORIES;

function canonicalMatch(value: string): Category | undefined {
  const lower = value.toLowerCase();
  return CATEGORIES.find((category) => category.toLowerCase() === lower);
}

/**
 * Map a stored or hand-typed label onto the canonical category list.
 *
 * Known aliases and any case-insensitive match of a real category are
 * rewritten; anything else is returned trimmed and unchanged, so unknown data
 * is never silently replaced with a different category.
 */
export function normalizeCategory(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (KNOWN.includes(trimmed)) return trimmed;

  const alias = CATEGORY_ALIASES[trimmed];
  if (alias) return alias;

  const lower = trimmed.toLowerCase();
  for (const [from, to] of Object.entries(CATEGORY_ALIASES)) {
    if (from.toLowerCase() === lower) return to;
  }

  return canonicalMatch(trimmed) ?? trimmed;
}

/**
 * Tags offered as a hint once a category is chosen. Nothing here is applied
 * automatically: tags stay optional and user-entered.
 */
export const SUGGESTED_TAGS: Partial<Record<Category, string[]>> = {
  'Fitness & Health': [
    'gym',
    'fitness',
    'workout',
    'bodybuilding',
    'weightlifting',
    'calisthenics',
    'cardio',
    'running',
    'strength',
    'exercise',
    'fitness-progress',
  ],
};

export function suggestedTagsFor(category: string): string[] {
  const canonical = normalizeCategory(category);
  return SUGGESTED_TAGS[canonical as Category] ?? [];
}
