import { Link } from 'react-router-dom';
import { projectLinks } from '../lib/projectLinks';

/**
 * Era-style footer with real app routes and public project destinations.
 */
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <p className="site-footer__brand">
          Skeuo Video <span>Just videos. Like the old days.</span>
        </p>
        <div className="site-footer__columns">
          <section aria-labelledby="footer-explore">
            <h2 id="footer-explore" className="site-footer__heading">
              Explore
            </h2>
            <ul>
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/videos">Videos</Link>
              </li>
              <li>
                <Link to="/channels">Channels</Link>
              </li>
              <li>
                <Link to="/videos?sort=newest">Recently added</Link>
              </li>
            </ul>
          </section>
          <section aria-labelledby="footer-library">
            <h2 id="footer-library" className="site-footer__heading">
              Your Library
            </h2>
            <ul>
              <li>
                <Link to="/my-videos">My Videos</Link>
              </li>
              <li>
                <Link to="/playlists">Playlists</Link>
              </li>
              <li>
                <Link to="/subscriptions">Subscriptions</Link>
              </li>
              <li>
                <Link to="/channel/me">My channel</Link>
              </li>
              <li>
                <Link to="/upload">Upload</Link>
              </li>
            </ul>
          </section>
          <section aria-labelledby="footer-skeuo">
            <h2 id="footer-skeuo" className="site-footer__heading">
              Skeuo
            </h2>
            <ul>
              <li>
                <Link to="/about">About</Link>
              </li>
              <li>
                <a href={projectLinks.repository}>GitHub</a>
              </li>
              <li>
                <a href={projectLinks.contributions}>Contributions</a>
              </li>
              <li>
                <a href={projectLinks.reportBug}>Report a Bug</a>
              </li>
            </ul>
          </section>
          <section aria-labelledby="footer-legal">
            <h2 id="footer-legal" className="site-footer__heading">
              Legal
            </h2>
            <ul>
              <li>
                <Link to="/privacy">Privacy</Link>
              </li>
              <li>
                <Link to="/terms">Terms</Link>
              </li>
              <li>
                <a href={projectLinks.license}>MIT License</a>
              </li>
              <li>
                <a href={projectLinks.thirdParty}>Third-party notices</a>
              </li>
            </ul>
          </section>
        </div>
        <p className="site-footer__legal">
          © 2026 Skeuo contributors. An independent open-source project, not
          affiliated with, endorsed by, or connected to YouTube or Google.
        </p>
      </div>
    </footer>
  );
}
