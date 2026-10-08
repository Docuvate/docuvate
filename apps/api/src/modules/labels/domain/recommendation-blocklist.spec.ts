import { describe, expect, it } from 'vitest';
import {
  clusterBlocklistPhrases,
  matchesBlocklistPattern,
  matchesUserBlocklist,
  parseBlocklistPatternProposal,
} from './recommendation-blocklist.js';
import { collectNewLabelCandidates } from './label-vocabulary.js';

describe('recommendation-blocklist', () => {
  it('blocks candidates matching user phrase', () => {
    expect(matchesUserBlocklist('PDF-XChange Producer', ['PDF-XChange'])).toBe(true);
    expect(matchesUserBlocklist('Angebot', ['PDF-XChange'])).toBe(false);
  });

  it('matches confirmed regex patterns', () => {
    expect(matchesBlocklistPattern('PDF-XCHANGE Editor', ['pdf[- ]?xchange'])).toBe(true);
    expect(matchesBlocklistPattern('Angebot', ['pdf[- ]?xchange'])).toBe(false);
  });

  it('clusters related phrases', () => {
    const clusters = clusterBlocklistPhrases([
      'PDF-XChange',
      'PDF-XCHANGE Editor',
      'Rechnung',
    ]);
    expect(clusters).toHaveLength(1);
    expect(clusters[0]).toHaveLength(2);
  });

  it('parses JSON pattern proposals', () => {
    const parsed = parseBlocklistPatternProposal(
      '{"pattern":"pdf[- ]?x?change","explanation":"Varianten"}'
    );
    expect(parsed?.pattern).toBe('pdf[- ]?x?change');
  });

  it('respects blocklist in collectNewLabelCandidates', () => {
    const candidates = collectNewLabelCandidates(
      [
        {
          documentId: 'd1',
          title: 'Scan',
          filename: 'scan.pdf',
          text: 'Angebot gültig bis morgen',
          fields: [],
          nonInboxTagIds: [],
        },
      ],
      [],
      new Set(),
      ['Angebot']
    );
    expect(candidates).toHaveLength(0);
  });
});
