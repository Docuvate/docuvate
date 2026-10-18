// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Navigate } from 'react-router-dom';

import { isErrorScreenPreviewEnabled } from '../lib/errorPreviewRoutes';
import { routes } from '../lib/routes';
import { ErrorScreensPreviewPage } from './ErrorScreensPreviewPage';

export function ErrorScreensPreviewRoute() {
  if (!isErrorScreenPreviewEnabled()) {
    return <Navigate to={routes.documents} replace />;
  }
  return <ErrorScreensPreviewPage />;
}
