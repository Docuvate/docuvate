// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { ForbiddenError } from '../../../shared/domain/errors.js';
import type { SavedDocumentViewEntity } from './workspace.types.js';

export function assertCanReadView(userId: string, view: SavedDocumentViewEntity): void {
  if (view.visibility === 'shared' || view.ownerUserId === userId) {
    return;
  }
  throw new ForbiddenError('Not authorized for this saved view');
}

export function assertCanMutateView(
  userId: string,
  isInstallationAdmin: boolean,
  view: SavedDocumentViewEntity
): void {
  if (view.ownerUserId === userId) {
    return;
  }
  if (view.visibility === 'shared' && isInstallationAdmin) {
    return;
  }
  throw new ForbiddenError('Not authorized to change this saved view');
}

export function assertCanSetVisibility(
  isInstallationAdmin: boolean,
  visibility: 'private' | 'shared'
): void {
  if (visibility === 'shared' && !isInstallationAdmin) {
    throw new ForbiddenError('Only installation admins can publish shared views');
  }
}
