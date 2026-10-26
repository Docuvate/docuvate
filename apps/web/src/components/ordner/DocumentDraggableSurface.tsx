// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { CSSProperties, HTMLAttributes, LiHTMLAttributes, ReactNode } from 'react';

import { useDocumentDraggable } from './DocumentFolderDnD';

interface DocumentDraggableTableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  documentId: string;
  dragEnabled?: boolean;
  measureElementRef?: (element: HTMLTableRowElement | null) => void;
  children: ReactNode;
}

export function DocumentDraggableTableRow({
  documentId,
  dragEnabled,
  measureElementRef,
  children,
  style,
  ...rest
}: DocumentDraggableTableRowProps) {
  const drag = useDocumentDraggable({ documentId, disabled: !dragEnabled });
  const mergedStyle: CSSProperties | undefined =
    drag.style || style ? { ...style, ...drag.style } : undefined;
  const setRowRef = (node: HTMLTableRowElement | null) => {
    measureElementRef?.(node);
    if (dragEnabled) {
      drag.setNodeRef(node);
    }
  };
  return (
    <tr
      ref={setRowRef}
      style={mergedStyle}
      {...(dragEnabled ? drag.listeners : {})}
      {...(dragEnabled ? drag.attributes : {})}
      {...rest}
    >
      {children}
    </tr>
  );
}

interface DocumentDraggableGridItemProps extends LiHTMLAttributes<HTMLLIElement> {
  documentId: string;
  dragEnabled?: boolean;
  children: ReactNode;
}

export function DocumentDraggableGridItem({
  documentId,
  dragEnabled,
  children,
  className,
  style,
  ...rest
}: DocumentDraggableGridItemProps) {
  const drag = useDocumentDraggable({ documentId, disabled: !dragEnabled });
  const mergedStyle: CSSProperties | undefined =
    drag.style || style ? { ...style, ...drag.style } : undefined;
  return (
    <li
      ref={dragEnabled ? drag.setNodeRef : undefined}
      style={mergedStyle}
      className={className}
      {...(dragEnabled ? drag.listeners : {})}
      {...(dragEnabled ? drag.attributes : {})}
      {...rest}
    >
      {children}
    </li>
  );
}
