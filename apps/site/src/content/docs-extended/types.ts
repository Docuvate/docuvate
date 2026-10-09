export type DocGuideSection = {
  id: string;
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type DocGuidePage = {
  meta: { title: string; description: string };
  title: string;
  lead: string;
  sections: DocGuideSection[];
  ownerPlaceholder?: { heading: string; body: string };
};

export type DocsNavLink = { path: string; label: string };

export type DocsNavGroup = { title: string; items: DocsNavLink[] };

export type DocsExtendedContent = {
  nav: DocsNavGroup[];
  motivation: DocGuidePage;
  architecture: DocGuidePage;
  serviceApiKeys: DocGuidePage;
  backupUpgrade: DocGuidePage;
  models: DocGuidePage;
  kubernetes: DocGuidePage;
  comparisons: {
    meta: { title: string; description: string };
    overviewTitle: string;
    overviewLead: string;
    methodologyTitle: string;
    allLink: string;
    selfHostCta: string;
    testCtaHeading: string;
    testCtaBody: string;
    correctionNote: string;
    competitorStrengthsTitle: (name: string) => string;
    docuvateStrengthsTitle: string;
    whenToChooseTitle: string;
    migrationTitle: string;
    chooseThemLabel: (name: string) => string;
    chooseUsLabel: string;
    standLabel: string;
  };
};
