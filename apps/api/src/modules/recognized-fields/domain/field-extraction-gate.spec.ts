import { describe, expect, it } from 'vitest';
import { evaluateFieldExtractionGate } from './field-extraction-gate.js';

describe('evaluateFieldExtractionGate', () => {
  const baseLabels = {
    assignedTagIds: [] as string[],
    assignedNonInboxTagIds: [] as string[],
    suggestions: [] as Array<{ tagId: string; confidence: number; isInbox: boolean }>,
  };

  it('passes confidence gate when a non-inbox tag is assigned', () => {
    expect(
      evaluateFieldExtractionGate(
        {
          ...baseLabels,
          assignedTagIds: ['a'],
          assignedNonInboxTagIds: ['a'],
        },
        {
          confidenceGateEnabled: true,
          minLabelConfidence: 0.72,
          requiredLabelIds: [],
          requiredLabelMatch: 'all',
        }
      )
    ).toBe(true);
  });

  it('passes confidence gate when suggestion meets threshold', () => {
    expect(
      evaluateFieldExtractionGate(
        {
          ...baseLabels,
          suggestions: [{ tagId: 'b', confidence: 0.8, isInbox: false }],
        },
        {
          confidenceGateEnabled: true,
          minLabelConfidence: 0.72,
          requiredLabelIds: [],
          requiredLabelMatch: 'all',
        }
      )
    ).toBe(true);
  });

  it('fails confidence gate when only low-confidence suggestions exist', () => {
    expect(
      evaluateFieldExtractionGate(
        {
          ...baseLabels,
          suggestions: [{ tagId: 'b', confidence: 0.5, isInbox: false }],
        },
        {
          confidenceGateEnabled: true,
          minLabelConfidence: 0.72,
          requiredLabelIds: [],
          requiredLabelMatch: 'all',
        }
      )
    ).toBe(false);
  });

  it('requires all configured labels to be assigned (AND)', () => {
    expect(
      evaluateFieldExtractionGate(
        {
          ...baseLabels,
          assignedTagIds: ['a'],
          assignedNonInboxTagIds: ['a'],
        },
        {
          confidenceGateEnabled: true,
          minLabelConfidence: 0.5,
          requiredLabelIds: ['a', 'b'],
          requiredLabelMatch: 'all',
        }
      )
    ).toBe(false);

    expect(
      evaluateFieldExtractionGate(
        {
          ...baseLabels,
          assignedTagIds: ['a', 'b'],
          assignedNonInboxTagIds: ['a', 'b'],
        },
        {
          confidenceGateEnabled: true,
          minLabelConfidence: 0.5,
          requiredLabelIds: ['a', 'b'],
          requiredLabelMatch: 'all',
        }
      )
    ).toBe(true);
  });

  it('with confidence disabled, passes only when required labels are all assigned', () => {
    expect(
      evaluateFieldExtractionGate(
        {
          ...baseLabels,
          assignedTagIds: ['a'],
          assignedNonInboxTagIds: ['a'],
        },
        {
          confidenceGateEnabled: false,
          minLabelConfidence: 0.9,
          requiredLabelIds: ['a', 'b'],
          requiredLabelMatch: 'all',
        }
      )
    ).toBe(false);

    expect(
      evaluateFieldExtractionGate(
        {
          ...baseLabels,
          assignedTagIds: ['a', 'b'],
          assignedNonInboxTagIds: ['a'],
        },
        {
          confidenceGateEnabled: false,
          minLabelConfidence: 0.9,
          requiredLabelIds: ['a', 'b'],
          requiredLabelMatch: 'all',
        }
      )
    ).toBe(true);
  });

  it('passes when any required label is assigned (OR)', () => {
    expect(
      evaluateFieldExtractionGate(
        {
          ...baseLabels,
          assignedTagIds: ['a'],
          assignedNonInboxTagIds: ['a'],
        },
        {
          confidenceGateEnabled: false,
          minLabelConfidence: 0.5,
          requiredLabelIds: ['a', 'b'],
          requiredLabelMatch: 'any',
        }
      )
    ).toBe(true);

    expect(
      evaluateFieldExtractionGate(
        {
          ...baseLabels,
          assignedTagIds: [],
          assignedNonInboxTagIds: [],
        },
        {
          confidenceGateEnabled: false,
          minLabelConfidence: 0.5,
          requiredLabelIds: ['a', 'b'],
          requiredLabelMatch: 'any',
        }
      )
    ).toBe(false);
  });

  it('with both gates off, gated extraction does not run', () => {
    expect(
      evaluateFieldExtractionGate(baseLabels, {
        confidenceGateEnabled: false,
        minLabelConfidence: 0.5,
        requiredLabelIds: [],
        requiredLabelMatch: 'all',
      })
    ).toBe(false);
  });
});
