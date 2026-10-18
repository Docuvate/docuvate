// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { uploadPlacementFromAssignment } from './uploadPlacementFromAssignment';

describe('uploadPlacementFromAssignment', () => {
  it('maps folder assignment to folderId query param', () => {
    expect(
      uploadPlacementFromAssignment({ kind: 'folder', folderId: 'f1', label: 'Internet' })
    ).toEqual({ folderId: 'f1' });
  });

  it('returns undefined for inbox assignment', () => {
    expect(uploadPlacementFromAssignment({ kind: 'inbox' })).toBeUndefined();
  });
});
