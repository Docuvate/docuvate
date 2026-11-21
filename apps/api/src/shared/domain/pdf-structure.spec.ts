// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { isStructurallyValidPdf } from './pdf-structure.js';

describe('isStructurallyValidPdf', () => {
  it('rejects magic-only stubs that used to return HTTP 201', () => {
    expect(isStructurallyValidPdf(Buffer.from('%PDF-1.4\nbroken'))).toBe(false);
    expect(isStructurallyValidPdf(Buffer.from('%PDF-'))).toBe(false);
  });

  it('accepts a minimal trailer + object PDF', () => {
    const pdf = Buffer.from(
      `%PDF-1.4
1 0 obj
<< /Type /Catalog >>
endobj
xref
0 0
trailer
<< /Root 1 0 R >>
startxref
9
%%EOF
`,
      'latin1'
    );
    expect(isStructurallyValidPdf(pdf)).toBe(true);
  });
});
