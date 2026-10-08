import type { Box, TargetSizeFinding } from './types.js';

export const WCAG_TARGET_MIN_PX = 24;
export const PRIMARY_TARGET_MIN_HEIGHT_PX = 40;

export interface RawInteractiveElement {
  route: string;
  selectorHint: string;
  role: string;
  name: string;
  box: Box;
  isPrimaryControl: boolean;
  hasIcon: boolean;
  iconBox: Box | null;
  buttonGroupSiblingHeight: number | null;
}

export function evaluateTargetSize(raw: RawInteractiveElement): TargetSizeFinding {
  const wcag258Pass = raw.box.width >= WCAG_TARGET_MIN_PX && raw.box.height >= WCAG_TARGET_MIN_PX;
  const primaryHeightPass =
    !raw.isPrimaryControl || raw.box.height >= PRIMARY_TARGET_MIN_HEIGHT_PX;

  let iconCentered: boolean | null = null;
  if (raw.hasIcon && raw.iconBox) {
    const iconCx = raw.iconBox.x + raw.iconBox.width / 2;
    const iconCy = raw.iconBox.y + raw.iconBox.height / 2;
    const btnCx = raw.box.x + raw.box.width / 2;
    const btnCy = raw.box.y + raw.box.height / 2;
    iconCentered =
      Math.abs(iconCx - btnCx) <= 2 && Math.abs(iconCy - btnCy) <= Math.max(2, raw.box.height * 0.15);
  }

  let buttonGroupHeightMismatchPx: number | null = null;
  if (raw.buttonGroupSiblingHeight !== null) {
    buttonGroupHeightMismatchPx = Math.abs(raw.box.height - raw.buttonGroupSiblingHeight);
  }

  return {
    route: raw.route,
    selectorHint: raw.selectorHint,
    role: raw.role,
    name: raw.name,
    box: raw.box,
    wcag258Pass,
    primaryHeightPass,
    isPrimaryControl: raw.isPrimaryControl,
    iconCentered,
    buttonGroupHeightMismatchPx,
  };
}

export function summarizeTargetFindings(findings: TargetSizeFinding[]): {
  total: number;
  wcagFailures: number;
  primaryHeightFailures: number;
  iconOffCenter: number;
  buttonGroupMismatches: number;
} {
  return {
    total: findings.length,
    wcagFailures: findings.filter((f) => !f.wcag258Pass).length,
    primaryHeightFailures: findings.filter((f) => !f.primaryHeightPass).length,
    iconOffCenter: findings.filter((f) => f.iconCentered === false).length,
    buttonGroupMismatches: findings.filter(
      (f) => f.buttonGroupHeightMismatchPx !== null && f.buttonGroupHeightMismatchPx > 1
    ).length,
  };
}
