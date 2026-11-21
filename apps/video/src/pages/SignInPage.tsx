import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { usePageTitle } from '../lib/usePageTitle';
import { useStore } from '../store/AppStore';

const HANDLE_PATTERN = /^[a-z0-9_]{3,20}$/i;

/**
 * Local, browser-only profile. Deliberately not an authentication system:
 * there is no password, no server, and no claim of security. Milestone 2
 * replaces this page with session-based accounts.
 */
export function SignInPage() {
  const { profile, signIn, toast } = useStore();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const register = params.get('mode') === 'register';
  usePageTitle(register ? 'Create account' : 'Sign in');

  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [errors, setErrors] = useState<{ name?: string; handle?: string }>({});
  const next = params.get('next') ?? '/';

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedHandle = handle.trim().replace(/^@/, '');
    const nextErrors: typeof errors = {};
    if (trimmedName.length < 2) nextErrors.name = 'Enter a display name of at least 2 characters.';
    if (!HANDLE_PATTERN.test(trimmedHandle)) {
      nextErrors.handle = 'Use 3–20 letters, numbers or underscores.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    signIn({ name: trimmedName, handle: trimmedHandle.toLowerCase() });
    toast('Local profile created in this browser. No account exists on a server yet.', 'success');
    navigate(next, { replace: true });
  };

  if (profile) {
    return (
      <>
        <h1 className="page-title">You are signed in</h1>
        <div className="panel panel--narrow">
          <p>
            Signed in as <strong>{profile.name}</strong> (@{profile.handle}).
          </p>
          <p className="meta">
            This Skeuo Video profile is stored in this browser only. Clearing site data removes
            it, along with subscriptions, comments and playlists.
          </p>
          <p className="panel__actions">
            <Link className="button" to="/channel/me">
              Go to my channel
            </Link>
            <Link className="button" to="/upload">
              Upload a video
            </Link>
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="page-title">{register ? 'Create a local account' : 'Sign in'}</h1>
      <p className="lede">
        Accounts are not implemented on a server yet. Continuing creates a
        browser-local Skeuo Video profile that unlocks subscribing, commenting, voting,
        playlists and uploads in this preview. No password is requested or stored.
      </p>

      <form className="panel panel--narrow form" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="display-name">Display name</label>
          <input
            id="display-name"
            name="name"
            type="text"
            autoComplete="nickname"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'display-name-error' : undefined}
          />
          {errors.name ? (
            <p className="field__error" id="display-name-error" role="alert">
              Error: {errors.name}
            </p>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor="handle">Channel handle</label>
          <div className="field__prefix">
            <span aria-hidden="true">@</span>
            <input
              id="handle"
              name="handle"
              type="text"
              autoComplete="username"
              value={handle}
              onChange={(event) => setHandle(event.target.value)}
              aria-invalid={Boolean(errors.handle)}
              aria-describedby={errors.handle ? 'handle-error' : 'handle-hint'}
            />
          </div>
          <p className="field__hint" id="handle-hint">
            Shown next to your comments. Letters, numbers and underscores.
          </p>
          {errors.handle ? (
            <p className="field__error" id="handle-error" role="alert">
              Error: {errors.handle}
            </p>
          ) : null}
        </div>

        <p className="panel__actions">
          <button className="button button--primary" type="submit">
            {register ? 'Create local account' : 'Sign in'}
          </button>
        </p>
      </form>
    </>
  );
}
