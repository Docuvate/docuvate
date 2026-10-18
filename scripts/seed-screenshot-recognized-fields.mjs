#!/usr/bin/env node
/**
 * Seeds ~10 neutral recognized fields for the screenshot demo user.
 * Usage (API on localhost:3001, session cookie from browser or sign-in):
 *   DOCUVATE_API=http://localhost:3001 DOCUVATE_SESSION_COOKIE="better-auth.session_token=..." node scripts/seed-screenshot-recognized-fields.mjs
 */
const apiBase = process.env.DOCUVATE_API ?? 'http://localhost:3001';
const cookie = process.env.DOCUVATE_SESSION_COOKIE ?? '';

const fields = [
  { key: 'rechnungsnummer', label: 'Rechnungsnummer', fieldType: 'text', extractForAllDocuments: true, sortOrder: 0 },
  { key: 'rechnungsdatum', label: 'Rechnungsdatum', fieldType: 'date', extractForAllDocuments: true, sortOrder: 1 },
  { key: 'betrag', label: 'Betrag', fieldType: 'currency', extractForAllDocuments: true, sortOrder: 2 },
  { key: 'absender', label: 'Absender', fieldType: 'text', extractForAllDocuments: true, sortOrder: 3 },
  { key: 'iban', label: 'IBAN', fieldType: 'text', extractForAllDocuments: true, sortOrder: 4 },
  { key: 'vertragsende', label: 'Vertragsende', fieldType: 'date', extractForAllDocuments: true, sortOrder: 5 },
  { key: 'kundennummer', label: 'Kundennummer', fieldType: 'text', extractForAllDocuments: true, sortOrder: 6 },
  { key: 'ust_idnr', label: 'USt-IdNr.', fieldType: 'text', extractForAllDocuments: true, sortOrder: 7 },
  { key: 'faelligkeitsdatum', label: 'Fälligkeitsdatum', fieldType: 'date', extractForAllDocuments: true, sortOrder: 8 },
  { key: 'vertragsnummer', label: 'Vertragsnummer', fieldType: 'text', extractForAllDocuments: true, sortOrder: 9 },
];

async function main() {
  if (!cookie) {
    console.error('Set DOCUVATE_SESSION_COOKIE to an authenticated session.');
    process.exit(1);
  }
  const res = await fetch(`${apiBase}/recognized-fields`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    console.error('Seed failed', res.status, await res.text());
    process.exit(1);
  }
  const data = await res.json();
  console.log(`Seeded ${data.items?.length ?? 0} recognized fields.`);
}

void main();
