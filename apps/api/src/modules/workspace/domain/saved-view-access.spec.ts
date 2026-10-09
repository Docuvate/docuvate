import { describe, expect, it } from 'vitest';
import { ForbiddenError } from '../../../shared/domain/errors.js';
import {
  assertCanMutateView,
  assertCanReadView,
  assertCanSetVisibility,
} from './saved-view-access.js';
import type { SavedDocumentViewEntity } from './workspace.types.js';

const baseView = (overrides: Partial<SavedDocumentViewEntity> = {}): SavedDocumentViewEntity => ({
  id: 'v1',
  ownerUserId: 'owner',
  name: 'Test',
  visibility: 'private',
  searchQuery: '',
  sort: 'updatedAt',
  order: 'desc',
  viewMode: 'klassisch',
  filterMode: 'ui',
  listScope: 'all',
  folderId: null,
  mappeId: null,
  correspondentId: null,
  status: null,
  inbox: null,
  withoutNonInboxLabel: null,
  documentDateFrom: null,
  documentDateTo: null,
  tagIds: [],
  pinnedSidebar: false,
  position: 0,
  visibleColumns: ['title', 'labels', 'date', 'status'],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('saved view access', () => {
  it('allows owner to read private views', () => {
    expect(() => assertCanReadView('owner', baseView())).not.toThrow();
  });

  it('denies other users private views', () => {
    expect(() => assertCanReadView('other', baseView())).toThrow(ForbiddenError);
  });

  it('allows any user to read shared views', () => {
    expect(() =>
      assertCanReadView('other', baseView({ visibility: 'shared' }))
    ).not.toThrow();
  });

  it('allows admin to mutate shared views they do not own', () => {
    expect(() =>
      assertCanMutateView('admin', true, baseView({ visibility: 'shared', ownerUserId: 'owner' }))
    ).not.toThrow();
  });

  it('requires admin to publish shared visibility', () => {
    expect(() => assertCanSetVisibility(false, 'shared')).toThrow(ForbiddenError);
    expect(() => assertCanSetVisibility(true, 'shared')).not.toThrow();
  });
});
