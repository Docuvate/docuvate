// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentRegionDto } from '@docuvate/contracts';
import { createContext, type ReactNode, useContext } from 'react';

import { tableStructureOf } from '../../../lib/tableLayouts';
import {
  type TableStructureEditorState,
  useTableStructureEditor,
} from './useTableStructureEditor';

const TableStructureEditorContext = createContext<TableStructureEditorState | null>(null);

interface TableStructureEditorProviderProps {
  region: DocumentRegionDto | null;
  active: boolean;
  children: ReactNode;
}

function TableStructureEditorProviderInner({
  region,
  table,
  children,
}: {
  region: DocumentRegionDto;
  table: NonNullable<DocumentRegionDto['table']>;
  children: ReactNode;
}) {
  const editor = useTableStructureEditor(region, table);
  return (
    <TableStructureEditorContext.Provider value={editor}>
      {children}
    </TableStructureEditorContext.Provider>
  );
}

/**
 * Shares one structure draft between the side-panel grid and the table context ribbon.
 */
export function TableStructureEditorProvider({
  region,
  active,
  children,
}: TableStructureEditorProviderProps) {
  const table = region?.table ?? null;
  if (!active || !region || !table) {
    return (
      <TableStructureEditorContext.Provider value={null}>{children}</TableStructureEditorContext.Provider>
    );
  }
  return (
    <TableStructureEditorProviderInner
      key={`${region.id}:${JSON.stringify(tableStructureOf(table))}`}
      region={region}
      table={table}
    >
      {children}
    </TableStructureEditorProviderInner>
  );
}

export function useTableStructureEditorContext(): TableStructureEditorState | null {
  return useContext(TableStructureEditorContext);
}