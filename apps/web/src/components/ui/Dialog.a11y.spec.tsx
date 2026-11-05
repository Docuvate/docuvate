// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog a11y when closed', () => {
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
      this.removeAttribute('open');
    };
  });

  afterEach(() => {
    cleanup();
  });

  it('does not expose an empty delete-label heading while closed', () => {
    render(
      <ConfirmDialog
        open={false}
        title={'Delete label ""?'}
        description="hidden while closed"
        onConfirm={() => undefined}
        onCancel={() => undefined}
      />
    );
    expect(screen.queryByRole('heading', { name: /Delete label/i })).toBeNull();
  });
});
