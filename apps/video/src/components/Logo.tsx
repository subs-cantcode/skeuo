import { Link } from 'react-router-dom';

/**
 * Original Skeuo wordmark: a blue slab reading "Skeuo" beside "Video".
 * No YouTube logo, wordmark, or proprietary asset is used.
 */
export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Skeuo Video home">
      <span className="logo__slab" aria-hidden="true">
        Skeuo
      </span>
      <span className="logo__word" aria-hidden="true">
        Video
      </span>
      <span className="logo__tagline">Just videos. Like the old days.</span>
    </Link>
  );
}
