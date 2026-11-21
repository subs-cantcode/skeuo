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
    expect(screen.getByRole('navigation', { name: /Pagination/i })).toBeInTheDocument();
  });

  it('shows search results and opens a video from them', async () => {
    const user = userEvent.setup();
    renderAt('/results?q=harbour');

    const links = await screen.findAllByRole('link', { name: /Harbour Lights/i });
    expect(links.length).toBeGreaterThan(0);
    await user.click(links[0]);

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: /Harbour Lights — a short film in three tides/i,
      }),
    ).toBeInTheDocument();
  });

  it('renders a watch page with a real video element and a related rail', () => {
    const { container } = renderAt('/watch/v-harbour');
    const video = container.querySelector('video');
    expect(video).not.toBeNull();
    expect(video?.getAttribute('poster')).toMatch(/^data:image\/svg\+xml/);
    expect(video?.querySelector('source')?.getAttribute('src')).toMatch(/\.mp4$/);
    expect(screen.getByRole('heading', { name: /Related Videos/i })).toBeInTheDocument();
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

  it('falls back to a not-found page for unknown routes', () => {
    renderAt('/no-such-page');
    expect(
      screen.getByRole('heading', { level: 1, name: /Page not found/i }),
    ).toBeInTheDocument();
  });
});
