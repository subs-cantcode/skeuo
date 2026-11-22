import { describe, expect, it } from 'vitest';
import { CATEGORIES } from '../types';
import { normalizeCategory, suggestedTagsFor } from './categories';

describe('category list', () => {
  it('uses the corrected spelling for the two labels that were wrong', () => {
    expect(CATEGORIES).toContain('How to & Style');
    expect(CATEGORIES).toContain('Non-profit & Activism');
    expect(CATEGORIES).not.toContain('Howto & Style');
    expect(CATEGORIES).not.toContain('Nonprofits & Activism');
    expect(CATEGORIES).not.toContain('Nonprofit & Activism');
  });

  it('offers Fitness & Health as a selectable category', () => {
    expect(CATEGORIES).toContain('Fitness & Health');
  });

  it('has no duplicate entries', () => {
    expect(new Set(CATEGORIES).size).toBe(CATEGORIES.length);
  });
});

describe('normalizeCategory', () => {
  it('rewrites the labels earlier builds stored', () => {
    expect(normalizeCategory('Howto & Style')).toBe('How to & Style');
    expect(normalizeCategory('Nonprofits & Activism')).toBe('Non-profit & Activism');
    expect(normalizeCategory('Nonprofit & Activism')).toBe('Non-profit & Activism');
  });

  it('matches aliases regardless of case', () => {
    expect(normalizeCategory('howto & style')).toBe('How to & Style');
    expect(normalizeCategory('NONPROFITS & ACTIVISM')).toBe('Non-profit & Activism');
  });

  it('trims canonical values and returns them unchanged', () => {
    expect(normalizeCategory('  Music  ')).toBe('Music');
    expect(normalizeCategory('Fitness & Health')).toBe('Fitness & Health');
  });

  it('never invents a category for unknown data', () => {
    expect(normalizeCategory('Pottery')).toBe('Pottery');
    expect(normalizeCategory('')).toBe('');
  });

  it('is idempotent for every category', () => {
    for (const category of CATEGORIES) {
      expect(normalizeCategory(normalizeCategory(category))).toBe(category);
    }
  });
});

describe('fitness tag suggestions', () => {
  it('lists the fitness vocabulary as suggestions only', () => {
    const tags = suggestedTagsFor('Fitness & Health');
    for (const tag of [
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
    ]) {
      expect(tags).toContain(tag);
    }
  });

  it('suggests nothing for categories without a vocabulary', () => {
    expect(suggestedTagsFor('Comedy')).toEqual([]);
    expect(suggestedTagsFor('')).toEqual([]);
  });

  it('accepts the old spelling of a category for suggestions', () => {
    expect(suggestedTagsFor('Howto & Style')).toEqual([]);
  });
});
