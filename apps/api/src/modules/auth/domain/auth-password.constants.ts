// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  PASSWORD_LENGTH_MAX_BOUND,
  PASSWORD_LENGTH_MIN_BOUND,
} from '@docuvate/contracts';

/** Absolute floor passed to better-auth; instance policy may require a higher minimum. */
export const AUTH_MIN_PASSWORD_LENGTH = PASSWORD_LENGTH_MIN_BOUND;

export const AUTH_MAX_PASSWORD_LENGTH = PASSWORD_LENGTH_MAX_BOUND;
