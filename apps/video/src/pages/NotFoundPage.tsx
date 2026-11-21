import { Link } from 'react-router-dom';
import { usePageTitle } from '../lib/usePageTitle';

export function NotFoundPage() {
  usePageTitle('Page not found');
  return (
    <div className="not-found">
      <h1 className="page-title">Page not found</h1>
      <p>
        That address does not match a page in this library. The link may be old,
        or the video may have been removed.
      </p>
      <p>
        <Link to="/">Return to the homepage</Link> or{' '}
        <Link to="/videos">browse videos by category</Link>.
      </p>
    </div>
  );
}
