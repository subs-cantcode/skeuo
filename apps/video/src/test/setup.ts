import '@testing-library/jest-dom/vitest';

// jsdom has no layout engine; the layout shell scrolls on navigation.
Object.defineProperty(window, 'scrollTo', {
  value: () => undefined,
  writable: true,
});
