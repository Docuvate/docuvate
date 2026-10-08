import i18n from '../i18n';

const FIELD_LABELS: Record<string, string> = {
  date: 'recognizedFields.keys.date',
  documentdate: 'recognizedFields.keys.documentDate',
  duedate: 'recognizedFields.keys.dueDate',
  vendor: 'recognizedFields.keys.vendor',
  sender: 'recognizedFields.keys.vendor',
  supplier: 'recognizedFields.keys.supplier',
  amount: 'recognizedFields.keys.amount',
  total: 'recognizedFields.keys.total',
  iban: 'recognizedFields.keys.iban',
  reference: 'recognizedFields.keys.reference',
  invoicenumber: 'recognizedFields.keys.invoiceNumber',
  'invoice number': 'recognizedFields.keys.invoiceNumber',
};

export function extractionFieldLabel(key: string): string {
  const normalized = key.trim().toLowerCase().replace(/[_-]+/g, ' ');
  const compact = normalized.replace(/\s+/g, '');
  const i18nKey = FIELD_LABELS[normalized] ?? FIELD_LABELS[compact];
  if (i18nKey) {
    const translated = i18n.t(i18nKey);
    if (translated !== i18nKey) return translated;
  }
  return key;
}
