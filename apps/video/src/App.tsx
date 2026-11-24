import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { BrowsePage } from './pages/BrowsePage';
import { CategoryPage } from './pages/CategoryPage';
import { ChannelPage } from './pages/ChannelPage';
import { ChannelsPage } from './pages/ChannelsPage';
import { HomePage } from './pages/HomePage';
import { MyVideosPage } from './pages/MyVideosPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlaylistsPage } from './pages/PlaylistsPage';
import { SearchPage } from './pages/SearchPage';
import { SignInPage } from './pages/SignInPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { UploadPage } from './pages/UploadPage';
import { WatchPage } from './pages/WatchPage';

/** Keep old bookmarks, refinements and anchors while using one browse route. */
function CategoriesRedirect() {
  const { pathname, search, hash } = useLocation();
  return <Navigate replace to={{ pathname: pathname.replace(/^\/categories(?=\/|$)/i, '/videos'), search, hash }} />;
}

/** Route table, exported separately so tests can mount it in a MemoryRouter. */
export function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/watch/:id" element={<WatchPage />} />
        <Route path="/channel/:id" element={<ChannelPage />} />
        <Route path="/channels" element={<ChannelsPage />} />
        <Route path="/subscriptions" element={<SubscriptionsPage />} />
        <Route path="/results" element={<SearchPage />} />
        <Route path="/playlists" element={<PlaylistsPage />} />
        <Route path="/my-videos" element={<MyVideosPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/videos" element={<BrowsePage />} />
        <Route path="/videos/:category" element={<CategoryPage />} />
        <Route path="/categories/*" element={<CategoriesRedirect />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}
