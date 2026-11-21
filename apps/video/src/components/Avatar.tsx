import { initials } from '../lib/format';

interface AvatarProps {
  name: string;
  color: string;
  size?: 'small' | 'medium' | 'large';
}

/** Square initials avatar; the era's channels used square images, not circles. */

/**
 * Present for Skeuo Video channel and byline identity. Color comes from the
 * channel record.
 */
export function Avatar({ name, color, size = 'medium' }: AvatarProps) {
  return (
    <span
      className={`avatar avatar--${size}`}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
