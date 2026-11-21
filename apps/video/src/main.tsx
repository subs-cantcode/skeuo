import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './App';
import { AppStoreProvider } from './store/AppStore';
import './styles/retro.css';

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <AppStoreProvider>
        <AppRoutes />
      </AppStoreProvider>
    </BrowserRouter>
  </StrictMode>,
);
