import { describe, expect, it } from 'vitest';
import {
  LIBRARY_TABLE_HIDE_FOLDER_MAX_PX,
  LIBRARY_TABLE_HIDE_STATUS_MAX_PX,
  libraryTableColumnVisibility,
} from './libraryTableResponsive';

describe('libraryTableColumnVisibility', () => {
  it('hides folder before status as width shrinks', () => {
    const wide = libraryTableColumnVisibility(1280);
    expect(wide.folderColumn).toBe(true);
    expect(wide.statusColumn).toBe(true);

    const mid = libraryTableColumnVisibility(1150);
    expect(mid.folderColumn).toBe(false);
    expect(mid.statusColumn).toBe(true);

    const narrow = libraryTableColumnVisibility(1000);
    expect(narrow.folderColumn).toBe(false);
    expect(narrow.statusColumn).toBe(false);
  });

  it('uses ordered breakpoints', () => {
    expect(LIBRARY_TABLE_HIDE_FOLDER_MAX_PX).toBeGreaterThan(LIBRARY_TABLE_HIDE_STATUS_MAX_PX);
  });
});
