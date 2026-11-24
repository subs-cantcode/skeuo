import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../lib/usePageTitle';

export function InformationPage({ title, children }: { title: string; children: ReactNode }) {
  usePageTitle(title);
  return (
    <article className="info-page">
      <div className="breadcrumb">
        <Link to="/">Home</Link> <span aria-hidden="true">›</span> {title}
      </div>
      <h1 className="page-title">{title}</h1>
      {children}
    </article>
  );
}
