import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/**
 * The era's sign-in wall, standing in for an account system that does not
 * exist yet. `next` is the path to return to after the local profile is made.
 *
 * This is a local profile wall in Milestone 1, not authentication.
 */
export function SignInPrompt({ next, children }: { next: string; children: ReactNode }) {
  return (
    <div className="panel panel--narrow">
      {children}
      <p className="panel__actions">
        <Link
          className="button button--primary"
          to={`/signin?next=${encodeURIComponent(next)}`}
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
