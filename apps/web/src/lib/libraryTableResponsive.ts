/** Keep in sync with `@container library-doc-table` rules in app.css. */
export const LIBRARY_TABLE_HIDE_FOLDER_MAX_PX = 1199;
export const LIBRARY_TABLE_HIDE_STATUS_MAX_PX = 1099;
export function libraryTableColumnVisibility(containerWidthPx: number): {
  folderColumn: boolean;
  statusColumn: boolean;
} {
  return {
    folderColumn: containerWidthPx > LIBRARY_TABLE_HIDE_FOLDER_MAX_PX,
    statusColumn: containerWidthPx > LIBRARY_TABLE_HIDE_STATUS_MAX_PX,
  };
}
