// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: MIT
import { createClient, createConfig, type Client } from '@hey-api/client-fetch';
import * as generatedSdk from './generated/sdk.gen.js';

export type DocuvateClientConfig = {
  /** Base URL including `/v1`, e.g. `https://api.example.com/v1` */
  baseUrl: string;
  apiKey?: string;
  headers?: Record<string, string>;
  fetch?: typeof fetch;
};

export class DocuvateClient {
  readonly http: Client;

  /** All OpenAPI operations (generated), bound to this client's HTTP config. */
  readonly api: typeof generatedSdk;

  constructor(config: DocuvateClientConfig) {
    this.http = createClient(
      createConfig({
        baseUrl: config.baseUrl.replace(/\/$/, ''),
        fetch: config.fetch,
        headers: {
          Accept: 'application/json',
          ...(config.apiKey
            ? {
                Authorization: `Bearer ${config.apiKey}`,
                'X-Docuvate-Api-Key': config.apiKey,
              }
            : {}),
          ...config.headers,
        },
      })
    );

    this.api = new Proxy(generatedSdk, {
      get: (target, property) => {
        const key = property as keyof typeof generatedSdk;
        const fn = target[key];
        if (typeof fn !== 'function') {
          return fn;
        }
        type SdkFn = (opts?: { client?: Client } & Record<string, unknown>) => unknown;
        return (options?: Record<string, unknown>) =>
          (fn as SdkFn)({ ...(options ?? {}), client: this.http });
      },
    }) as typeof generatedSdk;
  }
}
