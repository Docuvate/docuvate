// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Route, Routes, useLocation } from 'react-router-dom';
import { LocaleProvider } from './context/LocaleContext';
import { SiteShell } from './components/SiteShell';
import { SiteScrollManager } from './components/SiteScrollManager';
import { LandingPage } from './pages/LandingPage';
import { DocsPage } from './pages/DocsPage';
import { DocsApiPage } from './pages/DocsApiPage';
import { DocsSdksPage } from './pages/DocsSdksPage';
import { ImprintPage, LicensePage, PrivacyPage } from './pages/LegalPage';
import { DocsMotivationPage } from './pages/docs/DocsMotivationPage';
import { DocsArchitecturePage } from './pages/docs/DocsArchitecturePage';
import { DocsServiceApiKeysPage } from './pages/docs/DocsServiceApiKeysPage';
import { DocsBackupUpgradePage } from './pages/docs/DocsBackupUpgradePage';
import { DocsModelsPage } from './pages/docs/DocsModelsPage';
import { DocsKubernetesPage } from './pages/docs/DocsKubernetesPage';
import { DocsCompareIndexRedirect } from './pages/DocsCompareIndexRedirect';
import { DocsCompareMethodologyPage } from './pages/DocsCompareMethodologyPage';
import { DocsCompareDetailRoute } from './pages/docs/DocsCompareDetailRoute';
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
          <Route path="/docs/motivation" element={<DocsMotivationPage />} />
          <Route path="/docs/architektur" element={<DocsArchitecturePage />} />
          <Route path="/docs/service-schluessel" element={<DocsServiceApiKeysPage />} />
          <Route path="/docs/backup-und-upgrade" element={<DocsBackupUpgradePage />} />
          <Route path="/docs/modelle" element={<DocsModelsPage />} />
          <Route path="/docs/kubernetes" element={<DocsKubernetesPage />} />
          <Route path="/docs/vergleiche" element={<DocsCompareIndexRedirect />} />
          <Route path="/docs/vergleiche/methodik" element={<DocsCompareMethodologyPage />} />
          <Route path="/docs/vergleiche/:slug" element={<DocsCompareDetailRoute />} />
          <Route path="/docs/api" element={<DocsApiPage />} />
          <Route path="/docs/sdks" element={<DocsSdksPage />} />
          <Route path="/impressum" element={<ImprintPage />} />
          <Route path="/datenschutz" element={<PrivacyPage />} />
          <Route path="/lizenz" element={<LicensePage />} />

          <Route path="/en" element={<LandingPage />} />
          <Route path="/en/docs" element={<DocsPage />} />
          <Route path="/en/docs/motivation" element={<DocsMotivationPage />} />
          <Route path="/en/docs/architecture" element={<DocsArchitecturePage />} />
          <Route path="/en/docs/service-api-keys" element={<DocsServiceApiKeysPage />} />
          <Route path="/en/docs/backup-and-upgrade" element={<DocsBackupUpgradePage />} />
          <Route path="/en/docs/models" element={<DocsModelsPage />} />
          <Route path="/en/docs/kubernetes" element={<DocsKubernetesPage />} />
          <Route path="/en/docs/comparisons" element={<DocsCompareIndexRedirect />} />
          <Route path="/en/docs/comparisons/methodology" element={<DocsCompareMethodologyPage />} />
          <Route path="/en/docs/comparisons/:slug" element={<DocsCompareDetailRoute />} />
          <Route path="/en/docs/api" element={<DocsApiPage />} />
          <Route path="/en/docs/sdks" element={<DocsSdksPage />} />
          <Route path="/en/impressum" element={<ImprintPage />} />
          <Route path="/en/datenschutz" element={<PrivacyPage />} />
          <Route path="/en/license" element={<LicensePage />} />
        </Routes>
      </SiteShell>
    </LocaleProvider>
  );
}

export function App() {
  return <SiteRoutes />;
}
