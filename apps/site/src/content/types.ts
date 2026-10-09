// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export type FaqItem = { question: string; answer: string };

export type FeatureBlock = {
  id: string;
  title: string;
  body: string;
  bullets: string[];
  imageAlt: string;
  /** When false, landing shows copy only (no marketing PNG). */
  marketingScreenshot?: boolean;
};

export type HeroProductCard = {
  id: string;
  title: string;
  subtitle: string;
  screenshotId: string;
  imageAlt: string;
};

export type ProofItem = {
  id: 'fairCode' | 'local' | 'cpu' | 'openapi';
  label: string;
};

export type StepItem = { title: string; body: string };

export type IntegrationItem = {
  id: string;
  name: string;
  description: string;
};

export type LandingContent = {
  meta: { title: string; description: string };
  hero: {
    eyebrow: string;
    titleLine1: string;
    titleAccent: string;
    lead: string;
    primaryCta: string;
    secondaryCta: string;
    productCards: HeroProductCard[];
  };
  proof: { items: ProofItem[] };
  features: FeatureBlock[];
  featuresSection: { kicker: string; heading: string; lead: string };
  steps: { heading: string; items: StepItem[] };
  developers: {
    heading: string;
    body: string;
    primaryCta: string;
    secondaryCta: string;
    codeCaption: string;
    installSnippet: string;
    code: string;
  };
  closingCta: {
    heading: string;
    body: string;
    note: string;
    primaryCta: string;
    secondaryCta: string;
  };
  integrations: { heading: string; lead: string; items: IntegrationItem[] };
  why: {
    heading: string;
    lead: string;
    cards: { title: string; body: string }[];
    compareLink: string;
  };
  editions: {
    heading: string;
    lead: string;
    selfHostedTitle: string;
    selfHostedBody: string;
    cloudTitle: string;
    cloudBody: string;
  };
  faq: { heading: string; items: FaqItem[] };
};

export type DocsContent = {
  meta: { title: string; description: string };
  intro: { heading: string; lead: string };
  quickstart: { heading: string; steps: string[] };
  concepts: { heading: string; items: { title: string; body: string }[] };
  selfHosting: {
    heading: string;
    intro: string;
    envGroups: { title: string; vars: { name: string; description: string }[] }[];
  };
};

export type SdkExample = {
  title: string;
  code: string;
  language: 'typescript' | 'dart';
};

export type SdkOverviewRow = {
  sdk: string;
  packageName: string;
  sectionId: string;
  sectionLabel: string;
  preview: boolean;
};

export type SdkInstallSnippetLanguage = 'typescript' | 'dart' | 'yaml';

export type SdkPackageContent = {
  id: string;
  heading: string;
  preview: boolean;
  previewNote: string;
  installHeading: string;
  installBody: string;
  installSnippet: string;
  installSnippetLanguage: SdkInstallSnippetLanguage;
  auth: string;
  examples: SdkExample[];
};

export type SdkContent = {
  meta: { title: string; description: string };
  pageLead: string;
  previewBadge: string;
  overviewTable: {
    headings: { sdk: string; package: string; status: string; section: string };
    rows: SdkOverviewRow[];
  };
  introLead: string;
  introRuntimeSpec: string;
  introCodegenNote: string;
  serviceCredentials: { heading: string; body: string; steps: string[] };
  copyCode: string;
  copiedCode: string;
  node: SdkPackageContent;
  flutter: SdkPackageContent;
};

export type SiteContent = {
  nav: {
    docs: string;
    api: string;
    sdks: string;
    github: string;
    comparisons: string;
    editions: string;
  };
  footer: {
    tagline: string;
    product: string;
    developers: string;
    comparisons: string;
    project: string;
    legal: string;
    privacy: string;
    imprint: string;
    license: string;
    github: string;
    contactEmail: string;
    copyrightLine: string;
    openApiJson: string;
  };
  legal: {
    emptyValue: string;
    imprint: {
      title: string;
      ddgFallback: string;
      emailLabel: string;
    };
    privacy: {
      title: string;
      contactLabel: string;
      controllerLabel: string;
      paragraphs: string[];
    };
    license: {
      title: string;
      intro: string[];
      faqHeading: string;
      faq: FaqItem[];
      repoLinkLabel: string;
      commercialLabel: string;
      commercialUrl: string;
    };
  };
  landing: LandingContent;
  docs: DocsContent;
  apiPage: { lead: string };
  sdks: SdkContent;
};
