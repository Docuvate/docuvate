import { Navigate, Route, Routes } from 'react-router-dom';
import { authClient } from './lib/auth-client';
import { formatAuthClientError } from './lib/authErrors';
import { AppBootLoading } from './components/AppBootLoading';
import { AppShell } from './components/AppShell';
import { DocumentDetailPage } from './pages/DocumentDetailPage';
import { LibraryPage } from './pages/LibraryPage';
import { DashboardPage } from './pages/DashboardPage';
import { SavedViewsPage } from './pages/SavedViewsPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { LoginPage } from './pages/LoginPage';
import { LoginTwoFactorPage } from './pages/LoginTwoFactorPage';
import { RegisterPage } from './pages/RegisterPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { InviteAcceptPage } from './pages/InviteAcceptPage';
import { AccountSecuritySettingsPage } from './pages/AccountSecuritySettingsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { NotFoundRoute } from './pages/NotFoundRoute';
import { SettingsPage } from './pages/SettingsPage';
import { ConnectorsPage } from './pages/ConnectorsPage';
import { PaperlessConnectorSetupPage } from './pages/PaperlessConnectorSetupPage';
import { BlockedLabelsSettingsPage } from './pages/BlockedLabelsSettingsPage';
import { LabelsPage } from './pages/structure/LabelsPage';
import { RecognizedFieldsPage } from './pages/structure/RecognizedFieldsPage';
import { DateisystemExplorerPage } from './pages/DateisystemExplorerPage';
import { StylesDocsPage } from './pages/StylesDocsPage';
import { hadAuthenticatedSessionHint } from './lib/authSessionHint';
import { ConnectorsOAuthSetupDocPage } from './pages/ConnectorsOAuthSetupDocPage';
import { routes } from './lib/routes';

function Protected({ children }: { children: React.ReactNode }) {
  const { data, isPending, error } = authClient.useSession();
  if (isPending) return <AppBootLoading />;
  if (error) {
    return (
      <p className="error" role="alert">
        {formatAuthClientError(error, 'session')}
      </p>
    );
  }
  if (!data?.session) {
    const loginTarget = hadAuthenticatedSessionHint()
      ? `${routes.login}?reason=session_expired`
      : routes.login;
    return <Navigate to={loginTarget} replace />;
  }
  return <>{children}</>;
}

function ShellRoute({ children }: { children: React.ReactNode }) {
  return (
    <Protected>
      <AppShell>{children}</AppShell>
    </Protected>
  );
}

export function App() {
  return (
    <Routes>
      <Route path={routes.login} element={<LoginPage />} />
      <Route path={routes.loginTwoFactor} element={<LoginTwoFactorPage />} />
      <Route path={routes.register} element={<RegisterPage />} />
      <Route path={routes.inviteAccept} element={<InviteAcceptPage />} />
      <Route path={routes.forgotPassword} element={<ForgotPasswordPage />} />
      <Route path={routes.resetPassword} element={<ResetPasswordPage />} />
      <Route
        path={routes.inbox}
        element={<Navigate to={`${routes.documents}?filter=in%3Ainbox`} replace />}
      />
      <Route path={routes.home} element={<ShellRoute><DashboardPage /></ShellRoute>} />
      <Route path={routes.documents} element={<ShellRoute><LibraryPage /></ShellRoute>} />
      <Route path={routes.savedViews} element={<ShellRoute><SavedViewsPage /></ShellRoute>} />
      <Route
        path={routes.filesystem}
        element={<ShellRoute><DateisystemExplorerPage browseMode="root" /></ShellRoute>}
      />
      <Route
        path="/filesystem/containers/:mappeId"
        element={<ShellRoute><DateisystemExplorerPage browseMode="mappe" /></ShellRoute>}
      />
      <Route
        path="/filesystem/folders/:folderId"
        element={<ShellRoute><DateisystemExplorerPage browseMode="folder" /></ShellRoute>}
      />
      <Route path={routes.structureLabels} element={<ShellRoute><LabelsPage /></ShellRoute>} />
      <Route
        path={routes.structureRecognizedFields}
        element={<ShellRoute><RecognizedFieldsPage /></ShellRoute>}
      />
      <Route path={routes.settings} element={<ShellRoute><SettingsPage /></ShellRoute>} />
      <Route path={routes.docsStyles} element={<ShellRoute><StylesDocsPage /></ShellRoute>} />
      <Route
        path={routes.docsConnectorsOAuthSetup}
        element={
          <ShellRoute>
            <ConnectorsOAuthSetupDocPage />
          </ShellRoute>
        }
      />
      <Route
        path={routes.settingsConnectors}
        element={<ShellRoute><ConnectorsPage /></ShellRoute>}
      />
      <Route
        path="/settings/connectors/paperless/:installationId"
        element={<ShellRoute><PaperlessConnectorSetupPage /></ShellRoute>}
      />
      <Route
        path={routes.settingsBlockedLabels}
        element={<ShellRoute><BlockedLabelsSettingsPage /></ShellRoute>}
      />
      <Route
        path={routes.settingsAccountSecurity}
        element={<ShellRoute><AccountSecuritySettingsPage /></ShellRoute>}
      />
      <Route
        path={routes.settingsAdmin}
        element={<ShellRoute><AdminSettingsPage /></ShellRoute>}
      />
      <Route
        path={routes.settingsAdminUsers}
        element={<ShellRoute><AdminUsersPage /></ShellRoute>}
      />
      <Route
        path="/documents/:id"
        element={
          <ShellRoute>
            <DocumentDetailPage />
          </ShellRoute>
        }
      />
      <Route path="*" element={<NotFoundRoute />} />
    </Routes>
  );
}
