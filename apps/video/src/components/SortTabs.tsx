import { Link } from 'react-router-dom';

export interface SortTab {
  key: string;
  label: string;
  href: string;
}

/** The era's tab strip above a listing. One implementation for every listing in Skeuo Video. */
export function SortTabs({ options, current }: { options: SortTab[]; current: string }) {
  return (
    <div className="list-tabs" role="group" aria-label="Sort videos">
      {options.map((option) => {
        const active = option.key === current;
        return (
          <Link
            key={option.key}
            className={`list-tabs__tab${active ? ' is-active' : ''}`}
            to={option.href}
            aria-current={active ? 'true' : undefined}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
