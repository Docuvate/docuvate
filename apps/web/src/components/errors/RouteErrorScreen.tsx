// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useMemo } from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';

import { toUserFacingError } from '../../lib/apiErrors';
import { newClientErrorRequestId } from '../../lib/errorCodes';
import { DocuvateErrorPage } from './DocuvateErrorPage';

export function RouteErrorScreen() {
  const error = useRouteError();

  const facing = useMemo(() => toUserFacingError(error, 'errors.pages.routeFailed.lead'), [error]);
  const requestId = useMemo(() => {
    if (isRouteErrorResponse(error) && isRecord(error.data) && typeof error.data.requestId === 'string') {
      return error.data.requestId;
    }
    return newClientErrorRequestId();
  }, [error]);

  const code =
    facing.code ??
    (isRouteErrorResponse(error) && typeof error.status === 'number' && error.status >= 500
      ? 'INTERNAL_ERROR'
      : 'DOC_LOAD_FAILED');

  const httpStatus =
    isRouteErrorResponse(error) && typeof error.status === 'number' ? error.status : undefined;

  if (httpStatus != null && httpStatus >= 500) {
    return (
      <DocuvateErrorPage
        variant="server-error-page"
        sourceError={error}
        httpStatus={httpStatus}
        errorCode={code}
        requestId={requestId}
      />
    );
  }

  return (
    <DocuvateErrorPage
      variant="unexpected"
      sourceError={error}
      errorCode={code}
      requestId={requestId}
    />
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
