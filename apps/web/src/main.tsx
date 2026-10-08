import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { App } from './App';
import { RouteErrorFallback } from './components/RouteErrorFallback';
import './i18n';
import { initDocuvateTheme } from './lib/docuvateTheme';
import './styles/global.css';

initDocuvateTheme();
window.__DOCUVATE_BUILD_SHA__ = __DOCUVATE_BUILD_SHA__;
import './components/ui/components.css';
import './styles/app.css';

declare global {
  interface Window {
    __DOCUVATE_BUILD_SHA__?: string;
  }
}

window.__DOCUVATE_BUILD_SHA__ = import.meta.env.VITE_DOCUVATE_BUILD_SHA;

const router = createBrowserRouter([
  {
    path: '/*',
    element: <App />,
    errorElement: <RouteErrorFallback />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
