import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Footer } from './Footer';
import { Header } from './Header';
import { NavBar } from './NavBar';
import { ToastRegion } from './ToastRegion';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <ScrollToTop />
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <Header />
      <NavBar />
      <main id="main" className="container page" tabIndex={-1}>
        {children}
      </main>
      <Footer />
      <ToastRegion />
    </>
  );
}
