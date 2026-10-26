// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export type OverlayPortalLayer = 'modal' | 'drawer' | 'popover' | 'toast';

const LAYER_CLASS: Record<OverlayPortalLayer, string> = {
  modal: 'docuvate-overlay-portal docuvate-overlay-portal--modal',
  drawer: 'docuvate-overlay-portal docuvate-overlay-portal--drawer',
  popover: 'docuvate-overlay-portal docuvate-overlay-portal--popover',
  toast: 'docuvate-overlay-portal docuvate-overlay-portal--toast',
};

function layerId(layer: OverlayPortalLayer): string {
  return `docuvate-overlay-${layer}`;
}

/** Ensures a fixed full-viewport portal root for the given overlay layer. */
export function getOverlayPortalRoot(layer: OverlayPortalLayer): HTMLElement {
  const id = layerId(layer);
  const existing = document.getElementById(id);
  if (existing instanceof HTMLElement) {
    return existing;
  }
  const root = document.createElement('div');
  root.id = id;
  root.className = LAYER_CLASS[layer];
  document.body.appendChild(root);
  return root;
}
