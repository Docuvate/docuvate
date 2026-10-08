import { randomUUID } from 'node:crypto';

export function syntheticFolderName(label = 'Ordner'): string {
  return `${label} ${randomUUID().slice(0, 8)}`;
}

export function syntheticFolderId(): string {
  return randomUUID();
}
