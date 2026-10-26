// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { APIRequestContext } from '@playwright/test';

import { smokeProvisionCredentials } from './smoke-fixture-auth';

const ROOT_NAME = 'Workstream-E-Tree-Root';
const LEVEL2_NAME = 'Workstream-E-Tree-L2';
const LEVEL3_NAME = 'Workstream-E-Tree-L3';

export interface WorkstreamEFilesystemFixture {
  rootFolderId: string;
  level2FolderId: string;
  browseFolderId: string;
}

interface FolderDto {
  id: string;
  name: string;
  parentId?: string | null;
}

interface FolderListResponse {
  items?: FolderDto[];
}

async function listFolders(
  request: APIRequestContext,
  apiBase: string,
  webOrigin: string
): Promise<FolderDto[]> {
  const res = await request.get(`${apiBase}/v1/folders`, {
    headers: { origin: webOrigin },
  });
  if (!res.ok()) {
    throw new Error(`list folders failed: ${res.status()} ${await res.text()}`);
  }
  const body = (await res.json()) as FolderListResponse;
  return body.items ?? [];
}

async function createFolder(
  request: APIRequestContext,
  apiBase: string,
  webOrigin: string,
  name: string,
  parentId: string | null
): Promise<FolderDto> {
  const res = await request.post(`${apiBase}/v1/folders`, {
    headers: { origin: webOrigin, 'content-type': 'application/json' },
    data: { name, parentId },
  });
  if (!res.ok()) {
    throw new Error(`create folder "${name}" failed: ${res.status()} ${await res.text()}`);
  }
  return (await res.json()) as FolderDto;
}

function findFolder(
  items: FolderDto[],
  name: string,
  parentId: string | null
): FolderDto | undefined {
  return items.find((folder) => folder.name === name && (folder.parentId ?? null) === parentId);
}

async function findOrCreateFolder(
  request: APIRequestContext,
  apiBase: string,
  webOrigin: string,
  name: string,
  parentId: string | null
): Promise<FolderDto> {
  const items = await listFolders(request, apiBase, webOrigin);
  const existing = findFolder(items, name, parentId);
  if (existing) {
    return existing;
  }
  return createFolder(request, apiBase, webOrigin, name, parentId);
}

/**
 * Ensures a nested folder tree (3 levels) owned by the smoke fixture user.
 * Used by workstream E F13 so tree rows expose add/menu actions in the sidebar.
 */
export async function ensureWorkstreamEFilesystemTree(
  request: APIRequestContext,
  apiBase: string,
  webOrigin: string
): Promise<WorkstreamEFilesystemFixture> {
  const creds = smokeProvisionCredentials();
  const signIn = await request.post(`${apiBase}/api/auth/sign-in/email`, {
    headers: { origin: webOrigin },
    data: { email: creds.email, password: creds.password },
  });
  if (!signIn.ok()) {
    throw new Error(`workstream E folder seed sign-in failed: ${signIn.status()} ${await signIn.text()}`);
  }

  const root = await findOrCreateFolder(request, apiBase, webOrigin, ROOT_NAME, null);
  const level2 = await findOrCreateFolder(request, apiBase, webOrigin, LEVEL2_NAME, root.id);
  const level3 = await findOrCreateFolder(request, apiBase, webOrigin, LEVEL3_NAME, level2.id);

  return {
    rootFolderId: root.id,
    level2FolderId: level2.id,
    browseFolderId: level3.id,
  };
}
