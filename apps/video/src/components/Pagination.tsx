import { Link, useSearchParams } from 'react-router-dom';
import { pageTokens } from '../lib/pagination';

interface PaginationProps {
  page: number;
  pageCount: number;
}

/**
 * `Previous | 1 | 2 | … | Next`. Page lives in the query string, so every page
 * is linkable and browser back/forward works.
 *
 * Used across Skeuo Video listings.
 */
export function Pagination({ page, pageCount }: PaginationProps) {
  const [params] = useSearchParams();

  if (pageCount <= 1) return null;

  const href = (target: number) => {
    const next = new URLSearchParams(params);
    if (target <= 1) next.delete('page');
    else next.set('page', String(target));
    const query = next.toString();
    return query ? `?${query}` : '';
  };

  return (
    <nav className="pagination" aria-label="Pagination">
      <ul className="pagination__list">
        <li>
          {page > 1 ? (
            <Link className="pagination__cell" to={href(page - 1)} rel="prev">
              Previous
            </Link>
          ) : (
            <span className="pagination__cell is-disabled" aria-disabled="true">
              Previous
            </span>
          )}
        </li>
        {pageTokens(page, pageCount).map((token, index) =>
          token === 'gap' ? (
            <li key={`gap-${index}`}>
              <span className="pagination__gap" aria-hidden="true">
                …
              </span>
            </li>
          ) : (
            <li key={token}>
              {token === page ? (
                <span className="pagination__cell is-current" aria-current="page">
                  {token}
                </span>
              ) : (
                <Link className="pagination__cell" to={href(token)} aria-label={`Page ${token}`}>
                  {token}
                </Link>
              )}
            </li>
          ),
        )}
        <li>
          {page < pageCount ? (
            <Link className="pagination__cell" to={href(page + 1)} rel="next">
              Next
            </Link>
          ) : (
            <span className="pagination__cell is-disabled" aria-disabled="true">
              Next
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
