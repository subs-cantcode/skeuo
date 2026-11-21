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

  it('shows search results for the new catalog', async () => {
    const user = userEvent.setup();
    renderAt('/results?q=baking');

    const links = await screen.findAllByRole('link', { name: /Cookies baking in the oven/i });
    expect(links.length).toBeGreaterThan(0);
    await user.click(links[0]);

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: /Cookies baking in the oven/i,
      }),
    ).toBeInTheDocument();
  });

  it('shows attribution for externally sourced sample media', () => {
    const { container } = renderAt('/watch/v-baking-cookies');
    const attribution = container.querySelector('.video-card__attribution');
    expect(attribution).not.toBeNull();
    expect(attribution?.textContent).toContain('CC0');
    expect(attribution?.textContent).toContain('Wikimedia Commons');
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
