import { Link, NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/videos', label: 'Videos' },
  { to: '/my-videos', label: 'My Videos' },
  { to: '/subscriptions', label: 'Subscriptions' },
  { to: '/channels', label: 'Channels' },
  { to: '/categories', label: 'Categories' },
  { to: '/playlists', label: 'Playlists' },
];

/** Light-gray primary navigation with a bottom-border active marker. */
export function NavBar() {
  return (
    <nav className="nav-bar" aria-label="Primary">
      <div className="container nav-bar__inner">
        <ul className="nav-bar__list">
          {LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                className={({ isActive }) => `nav-bar__link${isActive ? ' is-active' : ''}`}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <Link to="/upload" className="button button--primary nav-bar__upload">
          Upload
        </Link>
      </div>
    </nav>
  );
}
