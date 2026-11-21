import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

interface SidebarBoxProps {
  title: string;
  actionLabel?: string;
  actionTo?: string;
  children: ReactNode;
  tone?: 'default' | 'brand';
}

/**
 * Bordered module with a gray header strip, as on the 2009 home and watch
 * pages. Used across Skeuo Video.
 */
export function SidebarBox({
  title,
  actionLabel,
  actionTo,
  children,
  tone = 'default',
}: SidebarBoxProps) {
  return (
    <section className={`box box--${tone}`} aria-label={title}>
      <div className="box__header">
        <h2 className="box__title">{title}</h2>
        {actionLabel && actionTo ? (
          <Link className="box__action" to={actionTo}>
            {actionLabel}
          </Link>
        ) : null}
      </div>
      <div className="box__body">{children}</div>
    </section>
  );
}
