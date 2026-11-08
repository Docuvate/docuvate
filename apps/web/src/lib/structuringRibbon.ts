// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { StructuringAspect } from './structuringAspects';

/**
 * Header is global navigation. The second ribbon row is a primary mode.
 * The third row lists only the tools that mode needs, and is absent otherwise.
 * Choosing Text or Layout changes the document stage. A scroll is not an effect.
 */
export const STRUCTURING_PRIMARIES = ['text', 'labels', 'layout', 'fields'] as const;
export type StructuringPrimary = (typeof STRUCTURING_PRIMARIES)[number];

export type StructuringContext = 'text' | 'layout';

export interface StructuringCommand {
  primary: StructuringPrimary;
  /** What replaces the document surface. */
  stage: 'text' | 'page';
  /** Third-row tools. Null means the row stays hidden. */
  context: StructuringContext | null;
  /** Layout side tab to open with the mode. */
  layoutTab: 'tables' | null;
  /** Inspector tab to open with the mode. Null leaves the inspector as it is. */
  inspector: 'labels' | 'fields' | null;
}

type ContextToolId = 'edit-text' | 'save-text' | 'pointer' | 'text-select' | 'region' | 'overlay';

type ContextToolReason = 'clean' | 'no-regions';

interface ContextTool {
  id: ContextToolId;
  enabled: boolean;
  reason: ContextToolReason | null;
}

export function primaryForAspect(aspect: StructuringAspect): StructuringPrimary {
  switch (aspect) {
    case 'ocr':
      return 'text';
    case 'labels':
      return 'labels';
    case 'layout':
      return 'layout';
    case 'fields':
      return 'fields';
    default: {
      const never: never = aspect;
      return never;
    }
  }
}

export function aspectForPrimary(primary: StructuringPrimary): StructuringAspect {
  switch (primary) {
    case 'text':
      return 'ocr';
    case 'labels':
      return 'labels';
    case 'layout':
      return 'layout';
    case 'fields':
      return 'fields';
    default: {
      const never: never = primary;
      return never;
    }
  }
}

export function commandForPrimary(primary: StructuringPrimary): StructuringCommand {
  switch (primary) {
    case 'text':
      return { primary, stage: 'text', context: 'text', layoutTab: null, inspector: null };
    case 'layout':
      return { primary, stage: 'page', context: 'layout', layoutTab: 'tables', inspector: null };
    case 'labels':
      return { primary, stage: 'page', context: null, layoutTab: null, inspector: 'labels' };
    case 'fields':
      return { primary, stage: 'page', context: null, layoutTab: null, inspector: 'fields' };
    default: {
      const never: never = primary;
      return never;
    }
  }
}

export function contextToolsFor(
  primary: StructuringPrimary | null,
  evidence: { textDirty: boolean; hasOverlays: boolean }
): readonly ContextTool[] {
  if (primary === null) return [];
  const command = commandForPrimary(primary);
  switch (command.context) {
    case null:
      return [];
    case 'text':
      return [
        { id: 'edit-text', enabled: true, reason: null },
        {
          id: 'save-text',
          enabled: evidence.textDirty,
          reason: evidence.textDirty ? null : 'clean',
        },
      ];
    case 'layout':
      return [
        { id: 'pointer', enabled: true, reason: null },
        { id: 'text-select', enabled: true, reason: null },
        { id: 'region', enabled: true, reason: null },
        {
          id: 'overlay',
          enabled: evidence.hasOverlays,
          reason: evidence.hasOverlays ? null : 'no-regions',
        },
      ];
    default: {
      const never: never = command.context;
      return never;
    }
  }
}
