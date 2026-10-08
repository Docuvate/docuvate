/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach } from 'vitest';
import { describe, expect, it, vi } from 'vitest';
import i18n from '../../i18n';
import { SaveBar } from './SaveBar';

i18n.changeLanguage('en');

afterEach(() => {
  cleanup();
});

describe('SaveBar', () => {
  it('renders nothing when not visible', () => {
    const { container } = render(
      <SaveBar visible={false} saving={false} onSave={vi.fn()} onDiscard={vi.fn()} />
    );
    expect(container.querySelector('.save-bar')).toBeNull();
  });

  it('shows discard and save actions when visible', () => {
    render(<SaveBar visible saving={false} onSave={vi.fn()} onDiscard={vi.fn()} />);
    expect(screen.getByRole('region', { name: /save bar/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /discard changes/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^save$/i })).toBeTruthy();
  });

  it('disables actions while saving', () => {
    render(<SaveBar visible saving onSave={vi.fn()} onDiscard={vi.fn()} />);
    expect(screen.getByRole('button', { name: /discard changes/i })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: /saving/i })).toHaveProperty('disabled', true);
  });
});
