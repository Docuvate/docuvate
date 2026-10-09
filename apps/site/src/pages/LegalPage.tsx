// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { FaqItem } from '../components/FaqItem';
import { legalConfig } from '../config/legalConfig';
import { useLocale } from '../context/LocaleContext';

const GITHUB_LICENSE_URL = 'https://github.com/Docuvate/docuvate/blob/main/LICENSE';
const GITHUB_EE_LICENSE_URL = 'https://github.com/Docuvate/docuvate/blob/main/LICENSE_EE.md';

export function ImprintPage() {
  const { content } = useLocale();
  const { imprint: copy } = content.legal;
  const { imprint: data } = legalConfig;
  const ddg = data.ddgHeading?.trim() || copy.ddgFallback;
  const mstv = data.mstvResponsible?.trim();

  return (
    <div className="legal-page-shell">
      <div className="site-container legal-page">
        <h1 className="landing-section-title landing-section-title-wide legal-page-title">
          {copy.title}
        </h1>
        <div className="legal-imprint-block">
          <p>{ddg}</p>
          <p>
            {data.providerName}
            <br />
            {data.street}
            <br />
            {data.postalCode} {data.city}
            <br />
            {copy.emailLabel}:{' '}
            <a className="legal-contact-link" href={`mailto:${data.email}`}>
              {data.email}
            </a>
          </p>
          {mstv ? <p>{mstv}</p> : null}
        </div>
      </div>
    </div>
  );
}

export function LicensePage() {
  const { content } = useLocale();
  const { license: copy } = content.legal;

  return (
    <div className="legal-page-shell">
      <div className="site-container legal-page">
        <h1 className="landing-section-title landing-section-title-wide legal-page-title">
          {copy.title}
        </h1>
        <div className="legal-privacy-block">
          {copy.intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <p>
            <a href={GITHUB_LICENSE_URL} target="_blank" rel="noreferrer">
              {copy.repoLinkLabel}
            </a>
            {' · '}
            <a href={GITHUB_EE_LICENSE_URL} target="_blank" rel="noreferrer">
              {copy.eeLinkLabel}
            </a>
          </p>
          <h2 className="landing-section-title legal-page-subtitle">{copy.faqHeading}</h2>
          {copy.faq.map((item) => (
            <FaqItem key={item.question} question={item.question} answer={item.answer} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function PrivacyPage() {
  const { content } = useLocale();
  const { privacy: copy } = content.legal;
  const contact = legalConfig.privacy.contactEmail.trim() || legalConfig.imprint.email;
  const controller = [
    legalConfig.privacy.controllerName,
    legalConfig.privacy.controllerAddress,
    contact,
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ');

  return (
    <div className="legal-page-shell">
      <div className="site-container legal-page">
        <h1 className="landing-section-title landing-section-title-wide legal-page-title">
          {copy.title}
        </h1>
        <div className="legal-privacy-block">
          {controller ? (
            <p>
              {copy.controllerLabel}: {controller}.
            </p>
          ) : null}
          {copy.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <p>
            {copy.contactLabel}:{' '}
            <a className="legal-contact-link" href={`mailto:${contact}`}>
              {contact}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
