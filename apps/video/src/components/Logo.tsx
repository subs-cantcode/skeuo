import { Link } from 'react-router-dom';

/**
 * Official Skeuo Video wordmark: blue play-button icon + "Skeuo Video" title
 * + "Just videos. Like the old days." tagline.
 * No YouTube logo, wordmark, or proprietary asset is used.
 */
export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Skeuo Video home">
      <img
        src="/branding/skeuo_video_wordmark.png"
        alt="Skeuo Video"
        width={528}
        height={131}
        className="logo__img"
      />
    </Link>
  );
}
