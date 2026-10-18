// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: MIT
export { DocuvateClient, type DocuvateClientConfig } from './client.js';
export {
  DocuvateApiError,
  DocuvateNetworkError,
  type ApiErrorBody,
  parseApiError,
} from './errors.js';
export * from './generated/index.js';
