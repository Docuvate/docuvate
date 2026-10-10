// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { App } from './App';
import { RouteErrorFallback } from './components/RouteErrorFallback';
import './i18n';
import { initDocuvateTheme } from './lib/docuvateTheme';
import './styles/global.css';

initDocuvateTheme();
import './components/ui/components.css';
import './styles/app.css';

declare global {
  interface Window {
    __DOCUVATE_BUILD_SHA__?: string;
  }
}

const viteBuildSha = import.meta.env.VITE_DOCUVATE_BUILD_SHA?.trim();
window.__DOCUVATE_BUILD_SHA__ = viteBuildSha || __DOCUVATE_BUILD_SHA__;

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
