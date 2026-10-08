/** Neutral fictional demo copy for screenshot seed assets (no real persons/companies). */

export const SCREENSHOT_USER = {
  name: 'Demo Nutzer',
  email: process.env.SCREENSHOT_USER_EMAIL ?? 'screenshots@docuvate.local',
  password: process.env.SCREENSHOT_USER_PASSWORD ?? 'screenshot-demo-pass-32chars-min!!',
};

export const SCREENSHOT_TAGS = [
  { name: 'Eingang', color: '#3d7dd6', isInbox: true },
  { name: 'Finanzen', color: '#2a9d6f' },
  { name: 'Vertrag', color: '#b86a12' },
  { name: 'Steuern', color: '#7c5cbf' },
];

/** Invoice doc (fields + chat screenshots). */
export const SCREENSHOT_INVOICE = {
  filename: 'rechnung-beispiel-2024-001.pdf',
  title: 'Rechnung Nordbeispiel Beratung',
  tagNames: ['Eingang', 'Finanzen'],
};

/** Additional library rows (5–6 documents total with invoice). */
export const SCREENSHOT_OTHER_DOCS = [
  { filename: 'mietvertrag-beispiel.pdf', title: 'Mietvertrag Wohnung Nord', tagNames: ['Vertrag'] },
  { filename: 'kontoauszug-januar.pdf', title: 'Kontoauszug Januar 2024', tagNames: ['Finanzen'] },
  { filename: 'tankbeleg-scan.jpg', title: 'Tankbeleg Dezember', tagNames: ['Eingang'] },
  { filename: 'versicherungsbescheinigung.pdf', title: 'Versicherungsbescheinigung Kfz', tagNames: ['Vertrag'] },
  { filename: 'gehaltsabrechnung-demo.pdf', title: 'Gehaltsabrechnung November', tagNames: ['Finanzen', 'Steuern'] },
];

export const SCREENSHOT_CHAT = {
  userMessage: 'Welche Fälligkeit steht in der Rechnung?',
};
