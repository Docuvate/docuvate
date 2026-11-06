// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { appSectionOf, documentsSubsectionOf } from './appNav';

describe('app navigation', () => {
  it('maps every main route to one header section', () => {
    expect(appSectionOf('/')).toBe('home');
    expect(appSectionOf('/documents')).toBe('documents');
    expect(appSectionOf('/documents/abc')).toBe('documents');
    expect(appSectionOf('/inbox')).toBe('documents');
    expect(appSectionOf('/review')).toBe('documents');
    expect(appSectionOf('/structure/labels')).toBe('labels');
    expect(appSectionOf('/structure/recognized-fields')).toBe('fields');
    expect(appSectionOf('/filesystem/folders/1')).toBe('folders');
    expect(appSectionOf('/settings/connectors')).toBe('settings');
    expect(appSectionOf('/docs/styles')).toBeNull();
  });

  it('keeps saved views apart from "all documents"', () => {
    expect(documentsSubsectionOf('/documents', '')).toBe('all');
    expect(documentsSubsectionOf('/documents', '?view=1')).toBeNull();
    expect(documentsSubsectionOf('/documents/views', '')).toBe('views');
    expect(documentsSubsectionOf('/documents/duplicates', '')).toBe('duplicates');
    expect(documentsSubsectionOf('/documents/xyz', '')).toBeNull();
  });
});
