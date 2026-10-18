// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { RouteErrorScreen } from './errors/RouteErrorScreen';

export function RouteErrorFallback() {
  return (
    <div className="page route-error-page">
      <RouteErrorScreen />
    </div>
  );
}
