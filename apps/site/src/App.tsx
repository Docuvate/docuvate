import { Route, Routes, useLocation } from 'react-router-dom';
import { LocaleProvider } from './context/LocaleContext';
import { SiteShell } from './components/SiteShell';
import { SiteScrollManager } from './components/SiteScrollManager';
import { LandingPage } from './pages/LandingPage';
import { DocsPage } from './pages/DocsPage';
import { DocsApiPage } from './pages/DocsApiPage';
import { DocsSdksPage } from './pages/DocsSdksPage';
import { ImprintPage, PrivacyPage } from './pages/LegalPage';
import { localeFromPathname } from './lib/routes';

function SiteRoutes() {
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);

  return (
    <LocaleProvider locale={locale}>
      <SiteScrollManager />
      <SiteShell>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/docs/api" element={<DocsApiPage />} />
          <Route path="/docs/sdks" element={<DocsSdksPage />} />
          <Route path="/impressum" element={<ImprintPage />} />
          <Route path="/datenschutz" element={<PrivacyPage />} />

          <Route path="/en" element={<LandingPage />} />
          <Route path="/en/docs" element={<DocsPage />} />
          <Route path="/en/docs/api" element={<DocsApiPage />} />
          <Route path="/en/docs/sdks" element={<DocsSdksPage />} />
          <Route path="/en/impressum" element={<ImprintPage />} />
          <Route path="/en/datenschutz" element={<PrivacyPage />} />
        </Routes>
      </SiteShell>
    </LocaleProvider>
  );
}

export function App() {
  return <SiteRoutes />;
}
