// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { classifyConnectivityFailure, readAuthClientErrorShape } from '../../lib/authConnectivity';
import { DocuvateErrorPage } from './DocuvateErrorPage';
import { FullPageErrorShell } from './FullPageErrorShell';
import { HttpStatusErrorPage } from './HttpStatusErrorPage';

export interface SessionBootErrorScreenProps {
  error: unknown;
  onRecovered: () => void;
}

export function SessionBootErrorScreen({ error, onRecovered }: SessionBootErrorScreenProps) {
  const connectivityKind = classifyConnectivityFailure(error);

  if (connectivityKind != null) {
    return (
      <FullPageErrorShell testId="session-boot-error-shell">
        <DocuvateErrorPage
          variant={connectivityKind}
          sourceError={error}
          enableAutoReconnect
          onRecovered={onRecovered}
        />
      </FullPageErrorShell>
    );
  }

  const parsed = readAuthClientErrorShape(error);
  if (parsed.status === 401) {
    return (
      <FullPageErrorShell testId="session-boot-error-shell">
        <HttpStatusErrorPage variant="401" />
      </FullPageErrorShell>
    );
  }

  return (
    <FullPageErrorShell testId="session-boot-error-shell">
      <DocuvateErrorPage variant="unexpected" sourceError={error} />
    </FullPageErrorShell>
  );
}
