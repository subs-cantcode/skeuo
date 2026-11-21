import { useEffect } from 'react';

/** Keep the document title descriptive per route. */
export function usePageTitle(title: string): void {
  useEffect(() => {
    document.title = title ? `${title} — Skeuo Video` : 'Skeuo Video — just videos. Like the old days.';
  }, [title]);
}
