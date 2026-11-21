import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/AppStore';
import { Logo } from './Logo';

/** Utility row: brand, search, account. Search works from every page. */
export function Header() {
  const { profile, signOut, toast } = useStore();
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState(params.get('q') ?? '');

  useEffect(() => {
    if (location.pathname === '/results') setQuery(params.get('q') ?? '');
  }, [location.pathname, params]);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/results?q=${encodeURIComponent(trimmed)}` : '/results');
  };

  return (
    <div className="utility-bar">
      <div className="container utility-bar__inner">
        <Logo />
        <form className="search-form" role="search" onSubmit={submit}>
          <label className="sr-only" htmlFor="site-search">
            Search videos
          </label>
          <input
            id="site-search"
            className="search-form__input"
            type="search"
            name="q"
            value={query}
            placeholder="Search videos, channels, tags"
            onChange={(event) => setQuery(event.target.value)}
          />
          <button className="search-form__button" type="submit">
            Search
          </button>
        </form>
        <div className="account">
          {profile ? (
            <details className="account__menu">
              <summary className="account__summary">
                Signed in as <strong>{profile.name}</strong>
              </summary>
              <ul className="account__list">
                <li>
                  <Link to="/channel/me">My channel</Link>
                </li>
                <li>
                  <Link to="/playlists">My playlists</Link>
                </li>
                <li>
                  <Link to="/upload">Upload a video</Link>
                </li>
                <li>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => {
                      signOut();
                      toast('Signed out. Your local Skeuo Video library is still in this browser.', 'info');
                    }}
                  >
                    Sign out
                  </button>
                </li>
              </ul>
            </details>
          ) : (
            <p className="account__links">
              <Link to="/signin">Sign in</Link>
              <span aria-hidden="true"> | </span>
              <Link to="/signin?mode=register">Create account</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
