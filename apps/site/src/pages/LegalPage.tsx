import { legalConfig } from '../config/legalConfig';
import { useLocale } from '../context/LocaleContext';

export function ImprintPage() {
  const { content } = useLocale();
  const { imprint: copy } = content.legal;
  const { imprint: data } = legalConfig;
  const ddg = data.ddgHeading?.trim() || copy.ddgFallback;
  const mstv = data.mstvResponsible?.trim();

  return (
    <div className="legal-page-shell">
      <div className="site-container legal-page">
        <h1 className="landing-section-title landing-section-title-wide legal-page-title">{copy.title}</h1>
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

export function PrivacyPage() {
  const { content } = useLocale();
  const { privacy: copy } = content.legal;
  const contact = legalConfig.privacy.contactEmail.trim() || legalConfig.imprint.email;
  const controller = [legalConfig.privacy.controllerName, legalConfig.privacy.controllerAddress, contact]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ');

  return (
    <div className="legal-page-shell">
      <div className="site-container legal-page">
        <h1 className="landing-section-title landing-section-title-wide legal-page-title">{copy.title}</h1>
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
