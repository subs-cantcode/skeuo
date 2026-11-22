import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppRoutes } from './App';
import { AppStoreProvider } from './store/AppStore';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppStoreProvider>
        <AppRoutes />
      </AppStoreProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('navigation', () => {
  it('renders the homepage with its era-style modules', () => {
    renderAt('/');
    expect(
      screen.getByRole('heading', { level: 1, name: /Videos Being Watched Now/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Featured Videos/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Recently Uploaded/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Most Popular/i })).toBeInTheDocument();
  });

  it('shows search results for the restored catalog', async () => {
    const user = userEvent.setup();
    renderAt('/results?q=harbour');

    const links = await screen.findAllByRole('link', { name: /Harbour Lights/i });
    expect(links.length).toBeGreaterThan(0);
    await user.click(links[0]);

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: /Harbour Lights/i,
      }),
    ).toBeInTheDocument();
  });

  it('labels fictional entries as demonstration content', () => {
    renderAt('/watch/v-harbour');
    expect(screen.getByText(/Demonstration entry/i)).toBeInTheDocument();
    expect(screen.getByText(/title, description, duration and/i)).toBeInTheDocument();
  });

  it('shows attribution for the real sample entry', () => {
    const { container } = renderAt('/watch/v-mdn-flower');
    const terms = [...container.querySelectorAll('.description__meta dt')].map(
      (node) => node.textContent,
    );
    expect(terms).toContain('Playback:');

    const values = [...container.querySelectorAll('.description__meta dd')]
      .map((node) => node.textContent)
      .join(' ');
    expect(values).toContain('MDN Web Docs sample media');
    expect(values).toContain('CC0 1.0');
  });

  it('renders a channel page from the channel index', async () => {
    const user = userEvent.setup();
    renderAt('/channels');
    const link = await screen.findByRole('link', { name: /Northlight Films/i });
    await user.click(link);
    expect(
      await screen.findByRole('heading', { level: 1, name: /Northlight Films/i }),
    ).toBeInTheDocument();
  });

  it('requires a local profile before showing the subscription feed', () => {
    renderAt('/subscriptions');
    expect(
      screen.getByRole('heading', { level: 1, name: /Subscriptions/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /^Sign in$/i }).length).toBeGreaterThan(0);
    expect(screen.getByText(/Subscriptions are per account/i)).toBeInTheDocument();
  });

  it('offers a My Videos page for the local library', () => {
    renderAt('/my-videos');
    expect(
      screen.getByRole('heading', { level: 1, name: /My Videos/i }),
    ).toBeInTheDocument();
    // jsdom has no IndexedDB, so the page must explain the limitation instead of
    // pretending the feature works.
    expect(screen.getByText(/Local storage is not available/i)).toBeInTheDocument();
  });

  it('never repeats the video being watched in its own rail', () => {
    const { container } = renderAt('/watch/v-harbour');
    // One href per card: a related row links its thumbnail and its title.
    const hrefsIn = (selector: string) =>
      [...(container.querySelector(selector)?.children ?? [])].map(
        (card) => card.querySelector('a[href^="/watch/"]')?.getAttribute('href') ?? '',
      );

    const moreFrom = hrefsIn('.compact-list');
    const related = hrefsIn('.related-list');

    expect(moreFrom.length).toBeGreaterThan(0);
    expect(related.length).toBeGreaterThan(0);
    // A video may appear in both lists, but never twice in the same one, and
    // never in the rail while it is the one playing.
    for (const list of [moreFrom, related]) {
      expect(new Set(list).size).toBe(list.length);
      expect(list).not.toContain('/watch/v-harbour');
    }
  });

  it('replaces Subscribe with a label on your own channel', () => {
    window.localStorage.setItem(
      'skeuo.video.state.v1',
      JSON.stringify({ profile: { name: 'Ada Lovelace', handle: 'ada' } }),
    );
    const { container } = renderAt('/channel/me');

    // The header and footer also link "My channel", so check the control itself.
    expect(container.querySelector('.button--own')?.textContent).toBe('My channel');
    expect(screen.queryByRole('button', { name: /subscribe/i })).toBeNull();
  });

  it('keeps a normal Subscribe control on someone else’s channel', () => {
    window.localStorage.setItem(
      'skeuo.video.state.v1',
      JSON.stringify({ profile: { name: 'Ada Lovelace', handle: 'ada' } }),
    );
    renderAt('/channel/backlot');

    expect(screen.getByRole('button', { name: /^Subscribe$/i })).toBeInTheDocument();
  });

  it('offers the corrected category labels in the refinement select', () => {
    const { container } = renderAt('/results?q=repair');
    const options = [...container.querySelectorAll('select option')].map(
      (option) => option.textContent,
    );

    expect(options).toContain('How to & Style');
    expect(options).toContain('Non-profit & Activism');
    expect(options).toContain('Fitness & Health');
    expect(options).not.toContain('Howto & Style');
    expect(options).not.toContain('Nonprofits & Activism');
  });

  it('normalises an old category spelling in a stored draft', () => {
    window.localStorage.setItem(
      'skeuo.video.state.v1',
      JSON.stringify({
        drafts: [
          {
            id: 'local-old',
            title: 'Old draft',
            description: '',
            channelId: 'me',
            category: 'Howto & Style',
            tags: [],
            durationSec: 30,
            views: 0,
            uploadedAt: '2026-01-01T00:00:00.000Z',
            src: '',
            thumbSeed: 1,
          },
        ],
      }),
    );
    const { container } = renderAt('/watch/local-old');
    const values = [...container.querySelectorAll('.description__meta dd')]
      .map((node) => node.textContent)
      .join('|');

    expect(values).toContain('How to & Style');
  });

  it('falls back to a not-found page for unknown routes', () => {
    renderAt('/no-such-page');
    expect(
      screen.getByRole('heading', { level: 1, name: /Page not found/i }),
    ).toBeInTheDocument();
  });
});
