// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';

import { addWindowKeydownListener } from './addWindowKeydownListener';

describe('addWindowKeydownListener', () => {
  it('registers in capture phase when requested so Mod+K runs before focused inputs', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const listener = vi.fn();

    const dispose = addWindowKeydownListener(listener, { capture: true });
    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function), true);

    dispose();
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function), true);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
