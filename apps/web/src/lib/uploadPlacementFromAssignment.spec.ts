// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { uploadPlacementFromAssignment } from './uploadPlacementFromAssignment';

describe('uploadPlacementFromAssignment', () => {
  it('maps mappe assignment to mappeId query param', () => {
    expect(uploadPlacementFromAssignment({ kind: 'mappe', mappeId: 'm1', label: 'EHW+' })).toEqual({
      mappeId: 'm1',
    });
  });

  it('maps folder assignment to folderId query param', () => {
    expect(
      uploadPlacementFromAssignment({ kind: 'folder', folderId: 'f1', label: 'Internet' })
    ).toEqual({ folderId: 'f1' });
  });
});
