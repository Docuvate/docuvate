// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import {
  buildDuplicateFeatureVector,
  compareDocumentTexts,
  type DuplicateCompareDocumentInput,
  type DuplicatePairContext,
} from './duplicate-content-compare.js';
import type { DuplicateTrainingSample } from './duplicate-logistic-regression.js';

export interface SyntheticDatasetSplit {
  train: DuplicateTrainingSample[];
  holdout: DuplicateTrainingSample[];
}

function mulberry32(seed: number): () => number {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, items: T[]): T {
  return items[Math.floor(rng() * items.length)];
}

function digits(rng: () => number, len: number): string {
  let out = '';
  for (let i = 0; i < len; i += 1) out += String(Math.floor(rng() * 10));
  return out;
}

function ocrNoise(rng: () => number, text: string): string {
  const chars = text.split('');
  const swaps = Math.max(1, Math.floor(chars.length * 0.01 * rng()));
  for (let i = 0; i < swaps; i += 1) {
    const idx = Math.floor(rng() * chars.length);
    if (/\d/.test(chars[idx])) {
      chars[idx] = String(Math.floor(rng() * 10));
    } else if (chars[idx] === ' ') {
      chars[idx] = rng() > 0.5 ? '  ' : '\n';
    } else {
      chars[idx] = chars[idx].toUpperCase() === chars[idx] ? chars[idx].toLowerCase() : chars[idx];
    }
  }
  return chars.join('');
}

type TemplateKind =
  | 'invoice'
  | 'statement'
  | 'tax_notice'
  | 'pay_slip'
  | 'letter'
  | 'contract';

function renderTemplate(kind: TemplateKind, values: Record<string, string>): string {
  switch (kind) {
    case 'invoice':
      return `Invoice ${values.id}\nVendor ${values.vendor}\nTotal ${values.amount}\nIssued ${values.date}\nLine ${values.line}`;
    case 'statement':
      return `Account statement ${values.id}\nPeriod ending ${values.date}\nBalance ${values.amount}\nAccount ${values.account}`;
    case 'tax_notice':
      return `Assessment ${values.id}\nTax year ${values.year}\nAssessed ${values.amount}\nReference ${values.ref}`;
    case 'pay_slip':
      return `Pay slip ${values.id}\nEmployee ${values.employee}\nNet pay ${values.amount}\nPeriod ${values.date}`;
    case 'letter':
      return `Letter ${values.id}\nSubject ${values.subject}\nBody paragraph with reference ${values.ref}`;
    case 'contract':
      return `Agreement ${values.id}\nParty A ${values.vendor}\nParty B ${values.employee}\nClause amount ${values.amount}`;
    default: {
      const _never: never = kind;
      return _never;
    }
  }
}

function baseValues(rng: () => number): Record<string, string> {
  return {
    id: digits(rng, 6),
    vendor: `Org${digits(rng, 3)}`,
    amount: `${digits(rng, 3)}.${digits(rng, 2)}`,
    date: `${digits(rng, 2)}/${digits(rng, 2)}/${digits(rng, 4)}`,
    line: `Item ${digits(rng, 2)} qty ${digits(rng, 1)}`,
    account: digits(rng, 8),
    year: digits(rng, 4),
    ref: digits(rng, 10),
    employee: `Person${digits(rng, 4)}`,
    subject: `Topic${digits(rng, 3)}`,
  };
}

function docInput(id: string, filename: string, title: string, body: string, pages: number) {
  return {
    documentId: id,
    filename,
    title,
    extractedTextSample: body,
    pageCount: pages,
  } satisfies DuplicateCompareDocumentInput;
}

function sampleFromPair(
  left: DuplicateCompareDocumentInput,
  right: DuplicateCompareDocumentInput,
  embeddingSimilarity: number,
  perceptual: number | null,
  label: 0 | 1
): DuplicateTrainingSample {
  const features = buildDuplicateFeatureVector({
    left,
    right,
    embeddingSimilarity,
    perceptualPageHashDistance: perceptual,
  });
  return { features, label };
}

function makeDuplicateInstance(
  rng: () => number,
  kind: TemplateKind,
  values: Record<string, string>
): { left: DuplicateCompareDocumentInput; right: DuplicateCompareDocumentInput; embedding: number } {
  const body = renderTemplate(kind, values);
  const variant = rng();
  let rightBody = body;
  if (variant < 0.33) rightBody = ocrNoise(rng, body);
  else if (variant < 0.66) rightBody = body.replace(/\s+/g, '  ');
  else rightBody = body.replace(/\n/g, '\n\n');

  const pages = 2 + Math.floor(rng() * 6);
  const left = docInput(`l-${digits(rng, 4)}`, `${kind}-${values.id}.pdf`, `${kind} ${values.id}`, body, pages);
  const right = docInput(
    `r-${digits(rng, 4)}`,
    `${kind}-${values.id}-copy.pdf`,
    `${kind} ${values.id}`,
    rightBody,
    pages + (rng() > 0.85 ? 1 : 0)
  );
  const alignment = compareDocumentTexts(
    `${left.filename}\n${left.title}\n${left.extractedTextSample}`,
    `${right.filename}\n${right.title}\n${right.extractedTextSample}`
  );
  const embedding = 0.94 + (1 - alignment.fractionDifferingTokens) * 0.05;
  return { left, right, embedding: Math.min(0.999, embedding) };
}

function makeSeriesInstance(
  rng: () => number,
  kind: TemplateKind
): { left: DuplicateCompareDocumentInput; right: DuplicateCompareDocumentInput; embedding: number } {
  const valuesA = baseValues(rng);
  const valuesB = { ...valuesA };
  valuesB.amount = `${digits(rng, 3)}.${digits(rng, 2)}`;
  valuesB.date = `${digits(rng, 2)}/${digits(rng, 2)}/${digits(rng, 4)}`;
  valuesB.year = digits(rng, 4);
  valuesB.id = digits(rng, 6);

  const bodyA = renderTemplate(kind, valuesA);
  const bodyB = renderTemplate(kind, valuesB);
  const pages = 2 + Math.floor(rng() * 5);
  const left = docInput(`l-${digits(rng, 4)}`, `${kind}-a.pdf`, `${kind}`, bodyA, pages);
  const right = docInput(`r-${digits(rng, 4)}`, `${kind}-b.pdf`, `${kind}`, bodyB, pages);
  const embedding = 0.86 + rng() * 0.1;
  return { left, right, embedding };
}

export function generateSyntheticDuplicateDataset(
  seed: number,
  count: number,
  holdoutRatio = 0.2
): SyntheticDatasetSplit {
  const rng = mulberry32(seed);
  const kinds: TemplateKind[] = [
    'invoice',
    'statement',
    'tax_notice',
    'pay_slip',
    'letter',
    'contract',
  ];
  const all: DuplicateTrainingSample[] = [];

  for (let i = 0; i < count; i += 1) {
    const kind = pick(rng, kinds);
    const duplicate = rng() > 0.45;
    if (duplicate) {
      const values = baseValues(rng);
      const pair = makeDuplicateInstance(rng, kind, values);
      const perceptual = rng() > 0.7 ? rng() * 0.08 : 0;
      all.push(sampleFromPair(pair.left, pair.right, pair.embedding, perceptual, 1));
    } else {
      const pair = makeSeriesInstance(rng, kind);
      all.push(sampleFromPair(pair.left, pair.right, pair.embedding, null, 0));
    }
  }

  const holdoutCount = Math.floor(all.length * holdoutRatio);
  const holdout = all.slice(0, holdoutCount);
  const train = all.slice(holdoutCount);
  return { train, holdout };
}

export function contextFromDocuments(
  left: DuplicateCompareDocumentInput,
  right: DuplicateCompareDocumentInput,
  embeddingSimilarity: number,
  perceptualPageHashDistance: number | null
): DuplicatePairContext {
  return { left, right, embeddingSimilarity, perceptualPageHashDistance };
}
