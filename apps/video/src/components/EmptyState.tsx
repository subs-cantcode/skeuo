import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  children: ReactNode;
}

/** Reusable empty-state block for Skeuo Video lists and rails. */
export function EmptyState({ title, children }: EmptyStateProps) {
  return (
    <div className="empty-state" role="note">
      <h2 className="empty-state__title">{title}</h2>
      <div className="empty-state__body">{children}</div>
    </div>
  );
}

