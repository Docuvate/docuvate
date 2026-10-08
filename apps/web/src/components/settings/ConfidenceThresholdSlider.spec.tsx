import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import i18n from '../../i18n';
import { ConfidenceThresholdSlider } from './ConfidenceThresholdSlider';

i18n.changeLanguage('de');

describe('ConfidenceThresholdSlider', () => {
  it('renders segmented track markers and zone labels', () => {
    const { container } = render(
      <ConfidenceThresholdSlider
        value={0.62}
        ariaLabel="Mindest-Sicherheit"
        onChange={() => undefined}
      />
    );
    expect(container.querySelector('.confidence-threshold-slider__segments')).not.toBeNull();
    expect(container.querySelectorAll('.confidence-threshold-slider__segment').length).toBe(4);
    expect(container.querySelectorAll('.confidence-threshold-slider__tick').length).toBeGreaterThanOrEqual(4);
    expect(container.querySelectorAll('.confidence-threshold-slider__legend-row').length).toBe(4);
    expect(screen.getByRole('slider', { name: 'Mindest-Sicherheit' })).toBeTruthy();
  });
});
