// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { FullPageErrorShell } from './errors/FullPageErrorShell';
import { RouteErrorScreen } from './errors/RouteErrorScreen';

export function RouteErrorFallback() {
  return (
    <FullPageErrorShell testId="route-error-fallback">
      <div className="route-error-page">
        <RouteErrorScreen />
      </div>
    </FullPageErrorShell>
  );
}
