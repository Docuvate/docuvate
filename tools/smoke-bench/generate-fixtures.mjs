#!/usr/bin/env node
/**
 * Regenerate synthetic smoke-bench fixtures (no personal data).
 * Committed outputs are used in CI; run locally when editing sources or manifest.
 */
import { execSync } from 'node:child_process';
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { minimalDocx } from './lib/minimal-docx.mjs';
import { minimalTextPdf } from './lib/minimal-pdf.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(here, 'fixtures');
mkdirSync(fixturesDir, { recursive: true });

const docs = [
  {
    file: '01-mietvertrag-synthetic.pdf',
    lines: [
      'Mietvertrag (synthetisch)',
      'Mieter: Alex Beispiel, Lindenweg 12',
      'Die monatliche Kaltmiete betraegt 945,00 EUR.',
      'Die Miete ist bis zum 3. Werktag faellig.',
    ],
  },
  {
    file: '02-arbeitszeugnis-synthetic.pdf',
    lines: [
      'Arbeitszeugnis (Muster)',
      'Frau Alex Beispiel war vom 01.03.2020 bis 31.12.2025 taetig.',
      'Die Kuendigungsfrist betraegt drei Monate zum Quartalsende.',
    ],
  },
  {
    file: '03-rechnung-nordwind.pdf',
    lines: [
      'Rechnung Nordwind GmbH',
      'Rechnungsnummer NW-2026-0042',
      'Gesamtsumme: 1.234,56 EUR',
      'IBAN DE89370400440532013000',
    ],
  },
  {
    file: '04-kontoauszug-synthetic.pdf',
    lines: [
      'Kontoauszug Musterbank',
      'Kontoinhaber: Alex Beispiel',
      'Saldo per 31.01.2026: 2.180,45 EUR',
    ],
  },
  {
    file: '05-bescheid-hundesteuer.pdf',
    lines: [
      'Bescheid Hundesteuer Stadt Muster',
      'Steuerpflichtiger: Alex Beispiel',
      'Jahresgebuehr: 120,00 EUR',
    ],
  },
  {
    file: '06-formular-antrag.pdf',
    lines: [
      'Antragsformular Behoerde Muster',
      'Antragsart: Adressaenderung',
      'Eingereicht am: 15.02.2026',
    ],
  },
  {
    file: '07-memo-english.pdf',
    lines: [
      'Internal memo (synthetic)',
      'Project codename: Cedar Archive',
      'Budget cap for Q2: USD 18,500.',
    ],
  },
  {
    file: '10-smart-dup-a.pdf',
    lines: [
      'NORDWIND ENERGIE GMBH',
      'Musterstrasse 12 80331 Muenchen',
      'Rechnung Nr. 2024-1001',
      'Datum: 01.06.2024',
      'Position Beschreibung Betrag',
      '1 Beratungsleistung',
      'Gesamtbetrag EUR 199.00',
    ],
  },
  {
    file: '11-smart-dup-b.pdf',
    lines: [
      'NORDWIND ENERGIE GMBH',
      'Musterstrasse 12 80331 Muenchen',
      'Rechnung Nr. 2024-1001',
      'Datum: 01.06.2024',
      'Position Beschreibung Betrag',
      '1 Beratungsleistung',
      'Gesamtbetrag EUR 199.OO',
    ],
  },
];

for (const doc of docs) {
  writeFileSync(join(fixturesDir, doc.file), minimalTextPdf(doc.lines));
}

function payslipLines({ headerDate, periodCode, monthGross, ytdGross }) {
  return [
    `ENTGELTNACHWEIS ${headerDate} Muster Nord AG`,
    'Personal-Nr. 4711  Kostenstelle 1200',
    'Bruttoentgelt / Gesamtbrutto (EBeschV)',
    `${periodCode} Gesamtbrutto (EBeschV) ${monthGross} ${ytdGross}`,
    `Nettoentgelt ${monthGross.replace(/00$/, '50')}`,
  ];
}

const monthPad = (month) => String(month).padStart(2, '0');

const payslipSpecs = [];
for (let month = 1; month <= 12; month += 1) {
  payslipSpecs.push({
    year: 2023,
    month,
    monthGross: `${String(3200 + month * 37)},00`,
    ytdGross: `${String(3200 + month * 900)},00`,
    headerDate: `${monthPad(month)}.${monthPad(month)}.2023`,
  });
}
for (let month = 1; month <= 10; month += 1) {
  const monthGross =
    month === 10 ? '5.432,10' : month === 6 ? '6.550,00' : `${String(4100 + month * 55)},00`;
  const ytdGross = month === 10 ? '54.321,00' : `${String(12000 + month * 1100)},00`;
  payslipSpecs.push({
    year: 2024,
    month,
    monthGross,
    ytdGross,
    headerDate: month === 10 ? '31.10.2024' : `${monthPad(month)}.${monthPad(month)}.2024`,
  });
}

for (const spec of payslipSpecs) {
  const file = `payslip-${String(spec.year)}-${monthPad(spec.month)}.pdf`;
  const periodCode = `/${monthPad(spec.month)}E`;
  writeFileSync(
    join(fixturesDir, file),
    minimalTextPdf(
      payslipLines({
        headerDate: spec.headerDate,
        periodCode,
        monthGross: spec.monthGross,
        ytdGross: spec.ytdGross,
      })
    )
  );
}

const taxCerts = [
  {
    file: 'lohnsteuerbescheinigung-2023.pdf',
    lines: [
      'Ausdruck der elektronischen Lohnsteuerbescheinigung 2023',
      'Arbeitnehmer Alex Beispiel',
      'Einbehaltene Lohnsteuer 9.876,54 EUR',
    ],
  },
  {
    file: 'lohnsteuerbescheinigung-2024.pdf',
    lines: [
      'Ausdruck der elektronischen Lohnsteuerbescheinigung 2024',
      'Arbeitnehmer Alex Beispiel',
      'Einbehaltene Lohnsteuer 12.345,67 EUR',
    ],
  },
];

for (const doc of taxCerts) {
  writeFileSync(join(fixturesDir, doc.file), minimalTextPdf(doc.lines));
}

const scannedSrc = join(here, '../../tools/screenshots/layout/fixtures/layout-ws-scanned.pdf');
copyFileSync(scannedSrc, join(fixturesDir, '08-scanned-letter.pdf'));

writeFileSync(
  join(fixturesDir, '09-memo-synthetic.docx'),
  minimalDocx(
    'Memo synthetisch',
    'Dieses DOCX ist ein reines Testdokument ohne personenbezogene Daten.'
  )
);

const xlsxOut = join(fixturesDir, '12-costs-synthetic.xlsx');
execSync(
  `uv run --project "${join(here, '../../apps/worker')}" python -c "from tests.synthetic_office_fixtures import synthetic_xlsx_bytes; open('${xlsxOut}','wb').write(synthetic_xlsx_bytes())"`,
  { stdio: 'inherit' }
);

console.log(`Smoke fixtures written to ${fixturesDir}`);
