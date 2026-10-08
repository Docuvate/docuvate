import legalJson from '../../legal.config.json';

export type ImprintConfig = {
  providerName: string;
  legalForm: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  representative: string;
  registerCourt: string;
  registerNumber: string;
  vatId: string;
  ddgHeading?: string;
  mstvResponsible?: string;
};

export type PrivacyConfig = {
  controllerName: string;
  controllerAddress: string;
  contactEmail: string;
  dpoEmail: string;
};

export type LegalConfig = {
  imprint: ImprintConfig;
  privacy: PrivacyConfig;
};

export const legalConfig: LegalConfig = legalJson as LegalConfig;

/** Required before GitHub Pages publish (see scripts/landing/check-legal-for-publish.mjs). */
export const IMPRINT_PUBLISH_REQUIRED_KEYS: (keyof ImprintConfig)[] = [
  'providerName',
  'street',
  'postalCode',
  'city',
  'country',
  'email',
];

export function imprintFieldFilled(key: keyof ImprintConfig): boolean {
  return String(legalConfig.imprint[key] ?? '').trim().length > 0;
}

export function imprintReadyForPublish(): boolean {
  return IMPRINT_PUBLISH_REQUIRED_KEYS.every(imprintFieldFilled);
}
