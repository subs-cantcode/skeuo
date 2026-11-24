import { Link } from 'react-router-dom';

/**
 * Dense era-style footer. Every link resolves to a route this app actually
 * has; there are no placeholder anchors.
 */
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div className="site-footer__columns">
          <section aria-labelledby="footer-browse">
            <h2 id="footer-browse" className="site-footer__heading">
              Browse
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
              Library
            </h2>
            <ul>
              <li>
                <Link to="/playlists">Playlists</Link>
              </li>
              <li>
                <Link to="/subscriptions">Subscriptions</Link>
              </li>
              <li>
                <Link to="/upload">Upload</Link>
              </li>
            </ul>
          </section>
          <section aria-labelledby="footer-about">
            <h2 id="footer-about" className="site-footer__heading">
              Account
            </h2>
            <ul>
              <li>
                <Link to="/signin">Sign in</Link>
              </li>
              <li>
                <Link to="/signin?mode=register">Create account</Link>
              </li>
              <li>
                <Link to="/channel/me">My channel</Link>
              </li>
            </ul>
          </section>
          <section aria-labelledby="footer-colophon">
            <h2 id="footer-colophon" className="site-footer__heading">
              Colophon
            </h2>
            <p className="site-footer__note">
              A frontend prototype built with React, TypeScript and Vite for the
              Skeuo project. Most entries are fictional demonstrations playing an
              openly licensed CC0 stand-in clip; one is a real sample. Thumbnails
              are generated SVG unless marked as an extracted frame.
            </p>
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
