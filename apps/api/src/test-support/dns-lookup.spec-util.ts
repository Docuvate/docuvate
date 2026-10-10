// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LookupAddress, LookupAllOptions, LookupOneOptions } from 'node:dns';
import { lookup } from 'node:dns/promises';

import { vi } from 'vitest';

/** Mock `dns.promises.lookup` for Paperless URL security (always uses `{ all: true }`). */
export function mockDnsLookupAll(addresses: LookupAddress[]): void {
  const first = addresses[0];
  if (!first) {
    throw new Error('mockDnsLookupAll requires at least one address');
  }
  vi.mocked(lookup).mockImplementation(
    (async (
      _hostname: string,
      options?: number | LookupOneOptions | LookupAllOptions
    ): Promise<LookupAddress | LookupAddress[]> => {
      if (typeof options === 'object' && options !== null && 'all' in options && options.all) {
        return addresses;
      }
      return first;
    }) as typeof lookup
  );
}

export function mockDnsLookupByHost(
  resolve: (host: string) => LookupAddress | LookupAddress[]
): void {
  vi.mocked(lookup).mockImplementation(
    (async (
      hostname: string,
      options?: number | LookupOneOptions | LookupAllOptions
    ): Promise<LookupAddress | LookupAddress[]> => {
      const resolved = resolve(hostname);
      if (typeof options === 'object' && options !== null && 'all' in options && options.all) {
        return Array.isArray(resolved) ? resolved : [resolved];
      }
      return Array.isArray(resolved) ? resolved[0] : resolved;
    }) as typeof lookup
  );
}
