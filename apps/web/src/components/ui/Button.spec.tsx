// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from './Button';

describe('Button', () => {
  it('stays disabled while loading even when disabled is explicitly false', () => {
    render(
      <Button type="button" disabled={false} loading>
        Submit
      </Button>
    );
    expect(screen.getByRole('button', { name: 'Submit' })).toHaveProperty('disabled', true);
  });
});
