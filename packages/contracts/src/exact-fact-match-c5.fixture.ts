// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import type { ExactFactMatchLabeledSample } from './exact-fact-match.js';

/**
 * Research C5 decoy-calibration set (German finance facts + decoy predicates).
 * Regenerate weights/threshold with `pnpm exec tsx bench/exact_fact_match_calibrate.ts`.
 */
export const EXACT_FACT_MATCH_C5_SAMPLES: readonly ExactFactMatchLabeledSample[] = [
  {
    id: 'lookup-reingewinn',
    queryTokens: ['reingewinn', '2025'],
    predicateKey: 'reingewinn 2025',
    valueText: '12.345,67 EUR',
    label: 'match',
  },
  {
    id: 'lookup-umsatz',
    queryTokens: ['umsatz'],
    predicateKey: 'umsatz 2024',
    valueText: '1.002.000,00 EUR',
    label: 'match',
  },
  {
    id: 'lookup-mwst',
    queryTokens: ['mwst', '2024'],
    predicateKey: 'mwst 2024',
    valueText: '19.000,00 EUR',
    label: 'match',
  },
  {
    id: 'count-betraege-reingewinn',
    queryTokens: ['reingewinn'],
    predicateKey: 'reingewinn 2023',
    valueText: '10.000,00 EUR',
    label: 'match',
  },
  {
    id: 'count-betraege-reingewinn-2',
    queryTokens: ['reingewinn'],
    predicateKey: 'reingewinn 2024',
    valueText: '11.000,00 EUR',
    label: 'match',
  },
  {
    id: 'count-partial-ebit',
    queryTokens: ['ebit'],
    predicateKey: 'ebit 2024',
    valueText: '250.000 EUR',
    label: 'match',
  },
  {
    id: 'count-reingewinn-year-mismatch',
    queryTokens: ['reingewinn', '2024'],
    predicateKey: 'reingewinn 2023',
    valueText: '10.000,00 EUR',
    label: 'match',
  },
  {
    id: 'lookup-partial-year',
    queryTokens: ['umsatz', '2023'],
    predicateKey: 'umsatz 2024',
    valueText: '1.002.000,00 EUR',
    label: 'match',
  },
  {
    id: 'sum-versicherungsbeitrag',
    queryTokens: ['versicherungsbeitrag'],
    predicateKey: 'versicherungsbeitrag',
    valueText: '120,00 EUR',
    label: 'match',
  },
  {
    id: 'lookup-personalaufwand',
    queryTokens: ['personalaufwand'],
    predicateKey: 'personalaufwand 2024',
    valueText: '450.000,00 EUR',
    label: 'match',
  },
  {
    id: 'decoy-gewinn-vs-reingewinn',
    queryTokens: ['gewinn', '2025'],
    predicateKey: 'reingewinn 2025',
    valueText: '12.345,67 EUR',
    label: 'decoy',
  },
  {
    id: 'decoy-weather',
    queryTokens: ['wetter', 'morgen'],
    predicateKey: 'reingewinn 2025',
    valueText: '12.345,67 EUR',
    label: 'decoy',
  },
  {
    id: 'decoy-random-predicate',
    queryTokens: ['iban'],
    predicateKey: 'reingewinn 2025',
    valueText: '12.345,67 EUR',
    label: 'decoy',
  },
  {
    id: 'decoy-versicherung-vs-umsatz',
    queryTokens: ['versicherung'],
    predicateKey: 'umsatz 2024',
    valueText: '1.002.000,00 EUR',
    label: 'decoy',
  },
  {
    id: 'decoy-single-char',
    queryTokens: ['steuer'],
    predicateKey: 'lohnsteuer 2024',
    valueText: '2.000 EUR',
    label: 'decoy',
  },
  {
    id: 'decoy-count-unrelated',
    queryTokens: ['anzahl', 'mitarbeiter'],
    predicateKey: 'reingewinn 2025',
    valueText: '12.345,67 EUR',
    label: 'decoy',
  },
  {
    id: 'match-lohnsteuer',
    queryTokens: ['lohnsteuer'],
    predicateKey: 'lohnsteuer 2024',
    valueText: '2.000 EUR',
    label: 'match',
  },
];

/** C5 strict gate: 0% decoy accepts in fixture replay, ~60% match recall on count-style tokens. */
export const EXACT_FACT_MATCH_PRIOR_STRICT_THRESHOLD = 0.72;
