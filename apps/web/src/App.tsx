// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Navigate, Route, Routes, useParams } from 'react-router-dom';

import { AdminRouteGuard } from './components/admin/AdminRouteGuard';
import { AppBootLoading } from './components/AppBootLoading';
import { AppShell } from './components/AppShell';
import { authClient } from './lib/auth-client';
import { formatAuthClientError } from './lib/authErrors';
import { hadAuthenticatedSessionHint } from './lib/authSessionHint';
import { isErrorScreenshotHarnessBuild } from './lib/errorPreviewRoutes';
import { useFeatureFlags } from './lib/remoteConfig';
import { routes } from './lib/routes';
import { AccountSecuritySettingsPage } from './pages/AccountSecuritySettingsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { BlockedLabelsSettingsPage } from './pages/BlockedLabelsSettingsPage';
import { ConnectorConnectionPage } from './pages/ConnectorConnectionPage';
import { ConnectorsOAuthSetupDocPage } from './pages/ConnectorsOAuthSetupDocPage';
import { ConnectorSourcesPage } from './pages/ConnectorSourcesPage';
import { ConnectorsPage } from './pages/ConnectorsPage';
import { DashboardPage } from './pages/DashboardPage';
import { DateisystemExplorerPage } from './pages/DateisystemExplorerPage';
import { DocumentDetailPage } from './pages/DocumentDetailPage';
import { DuplicatesOverviewPage } from './pages/DuplicatesOverviewPage';
import { ErrorCodeDocPage } from './pages/ErrorCodeDocPage';
import { ErrorScreensPreviewHarnessShell } from './pages/ErrorScreensPreviewHarnessShell';
import { ErrorScreensPreviewPage } from './pages/ErrorScreensPreviewPage';
import { ErrorScreensPreviewRoute } from './pages/ErrorScreensPreviewRoute';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { GlobalChatPage } from './pages/GlobalChatPage';
import { InviteAcceptPage } from './pages/InviteAcceptPage';
import { LibraryPage } from './pages/LibraryPage';
import { LoginBackupCodePage } from './pages/LoginBackupCodePage';
import { LoginPage } from './pages/LoginPage';
import { LoginTwoFactorPage } from './pages/LoginTwoFactorPage';
import { NotFoundRoute } from './pages/NotFoundRoute';
import { PaperlessConnectorSetupPage } from './pages/PaperlessConnectorSetupPage';
import { RegisterPage } from './pages/RegisterPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ReviewQueuePage } from './pages/ReviewQueuePage';
import { SavedViewsPage } from './pages/SavedViewsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LabelsPage } from './pages/structure/LabelsPage';
import { RecognizedFieldsPage } from './pages/structure/RecognizedFieldsPage';
import { StylesDocsPage } from './pages/StylesDocsPage';

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

function SourceConnectorsRoute({ children }: { children: React.ReactNode }) {
  const featureFlags = useFeatureFlags();
  if (!featureFlags.sourceConnectors) {
    return <Navigate to={routes.settingsConnectors} replace />;
  }
  return <>{children}</>;
}

function ConnectorConnectionSwitch() {
  const { pluginId = '' } = useParams();
  if (pluginId === 'paperless') {
    return <PaperlessConnectorSetupPage />;
  }
  return <ConnectorConnectionPage />;
}

export function App() {
  return (
    <Routes>
      <Route path={routes.login} element={<LoginPage />} />
      <Route path={routes.loginTwoFactor} element={<LoginTwoFactorPage />} />
      <Route path={routes.loginBackupCode} element={<LoginBackupCodePage />} />
      <Route path={routes.register} element={<RegisterPage />} />
      <Route path={routes.inviteAccept} element={<InviteAcceptPage />} />
      <Route path={routes.forgotPassword} element={<ForgotPasswordPage />} />
      <Route path={routes.resetPassword} element={<ResetPasswordPage />} />
      <Route
        path={routes.inbox}
        element={<Navigate to={`${routes.documents}?filter=in%3Ainbox`} replace />}
      />
      <Route
        path={routes.home}
        element={
          <ShellRoute>
            <DashboardPage />
          </ShellRoute>
        }
      />
      <Route
        path={routes.reviewQueue}
        element={
          <ShellRoute>
            <ReviewQueuePage />
          </ShellRoute>
        }
      />
      <Route
        path={routes.documents}
        element={
          <ShellRoute>
            <LibraryPage />
          </ShellRoute>
        }
      />
      <Route
        path={routes.duplicates}
        element={
          <ShellRoute>
            <DuplicatesOverviewPage />
          </ShellRoute>
        }
      />
      <Route
        path={routes.globalChat}
        element={
          <ShellRoute>
            <GlobalChatPage />
          </ShellRoute>
        }
      />
      <Route
        path={routes.savedViews}
        element={
          <ShellRoute>
            <SavedViewsPage />
          </ShellRoute>
        }
      />
      <Route
        path={routes.filesystem}
        element={
          <ShellRoute>
            <DateisystemExplorerPage browseMode="root" />
          </ShellRoute>
        }
      />
      <Route
        path={routes.filesystemUnassigned}
        element={
          <ShellRoute>
            <DateisystemExplorerPage browseMode="unassigned" />
          </ShellRoute>
        }
      />
      <Route
        path="/filesystem/folders/:folderId"
        element={
          <ShellRoute>
            <DateisystemExplorerPage browseMode="folder" />
          </ShellRoute>
        }
      />
      <Route
        path={routes.structureLabels}
        element={
          <ShellRoute>
            <LabelsPage />
          </ShellRoute>
        }
      />
      <Route
        path={routes.structureRecognizedFields}
        element={
          <ShellRoute>
            <RecognizedFieldsPage />
          </ShellRoute>
        }
      />
      <Route
        path={routes.settings}
        element={
          <ShellRoute>
            <SettingsPage />
          </ShellRoute>
        }
      />
      <Route
        path={routes.docsStyles}
        element={
          <ShellRoute>
            <StylesDocsPage />
          </ShellRoute>
        }
      />
      <Route
        path={routes.docsConnectorsOAuthSetup}
        element={
          <ShellRoute>
            <ConnectorsOAuthSetupDocPage />
          </ShellRoute>
        }
      />
      <Route
        path={routes.errorCodesIndex}
        element={
          <ShellRoute>
            <ErrorCodeDocPage />
          </ShellRoute>
        }
      />
      <Route
        path={`${routes.errorCodesIndex}/:code`}
        element={
          <ShellRoute>
            <ErrorCodeDocPage />
          </ShellRoute>
        }
      />
      {isErrorScreenshotHarnessBuild() ? (
        <Route
          path={`${routes.errorScreensPreview}/:screenId`}
          element={
            <ErrorScreensPreviewHarnessShell>
              <ErrorScreensPreviewPage />
            </ErrorScreensPreviewHarnessShell>
          }
        />
      ) : (
        <Route
          path={`${routes.errorScreensPreview}/:screenId`}
          element={
            <ShellRoute>
              <ErrorScreensPreviewRoute />
            </ShellRoute>
          }
        />
      )}
      <Route
        path={routes.settingsConnectors}
        element={
          <ShellRoute>
            <ConnectorsPage />
          </ShellRoute>
        }
      />
      <Route
        path="/settings/connectors/:pluginId/:connectionId/sources"
        element={
          <ShellRoute>
            <SourceConnectorsRoute>
              <ConnectorSourcesPage />
            </SourceConnectorsRoute>
          </ShellRoute>
        }
      />
      <Route
        path="/settings/connectors/:pluginId/:connectionId"
        element={
          <ShellRoute>
            <SourceConnectorsRoute>
              <ConnectorConnectionSwitch />
            </SourceConnectorsRoute>
          </ShellRoute>
        }
      />
      <Route
        path={routes.settingsBlockedLabels}
        element={
          <ShellRoute>
            <BlockedLabelsSettingsPage />
          </ShellRoute>
        }
      />
      <Route
        path={routes.settingsAccountSecurity}
        element={
          <ShellRoute>
            <AccountSecuritySettingsPage />
          </ShellRoute>
        }
      />
      <Route
        path={routes.settingsAdmin}
        element={
          <ShellRoute>
            <AdminRouteGuard>
              <AdminSettingsPage />
            </AdminRouteGuard>
          </ShellRoute>
        }
      />
      <Route
        path={routes.settingsAdminUsers}
        element={
          <ShellRoute>
            <AdminRouteGuard>
              <AdminUsersPage />
            </AdminRouteGuard>
          </ShellRoute>
        }
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
