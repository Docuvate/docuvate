import { ArrowRight, Check, Container, Database, FileCode2, Plug } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CodeBlock } from '../components/CodeBlock';
import { FaqItem } from '../components/FaqItem';
import { useLocale } from '../context/LocaleContext';
import { useDocuvateTheme } from '../lib/useDocuvateTheme';
import { screenshotSrc } from '../lib/screenshotAssets';
import type { ProofItem } from '../content/types';

const GITHUB_URL = 'https://github.com/Docuvate/docuvate';

const LOGO_MAP: Record<string, string> = {
  amazon_s3: '/plugin-logos/amazons3.svg',
  paperless: '/plugin-logos/paperlessngx.svg',
  home_assistant: '/plugin-logos/homeassistant.svg',
  gmail: '/plugin-logos/gmail.svg',
  outlook: '/plugin-logos/microsoftoutlook.svg',
};

function integrationAvailableLabel(locale: 'de' | 'en') {
  return locale === 'de' ? 'Verfügbar' : 'Available';
}

function featureScreenshotBase(featureId: string): string {
  if (featureId === 'labels') return 'folders';
  return featureId;
}

function ProofIcon({ id }: { id: ProofItem['id'] }) {
  const size = 18;
  const props = { size, strokeWidth: 2, 'aria-hidden': true as const };
  switch (id) {
    case 'agpl':
      return <FileCode2 {...props} />;
    case 'docker':
      return <Container {...props} />;
    case 'stack':
      return <Database {...props} />;
    case 'api':
      return <Plug {...props} />;
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

export function LandingPage() {
  const { content, locale, localizePath } = useLocale();
  const { theme } = useDocuvateTheme();
  const assetKey = `${locale}-${theme === 'dark' ? 'dark' : 'light'}`;
  const { landing } = content;

  return (
    <div className="landing-page">
      <section className="landing-hero-band" aria-labelledby="landing-hero-title">
        <div className="landing-container landing-hero-center">
          <p className="landing-kicker landing-kicker-on-dark">{landing.hero.eyebrow}</p>
          <h1 id="landing-hero-title" className="landing-hero-title">
            <span className="landing-hero-title-line">{landing.hero.titleLine1}</span>{' '}
            <span className="landing-hero-title-accent">{landing.hero.titleAccent}</span>
          </h1>
          <p className="landing-hero-lead">{landing.hero.lead}</p>
          <div className="hero-actions landing-hero-actions landing-hero-actions-centered">
            <Link className="btn btn-primary btn-lg landing-btn-primary" to={localizePath('/docs#quickstart')}>
              {landing.hero.primaryCta}
            </Link>
            <Link
              className="btn btn-secondary btn-lg landing-btn-on-hero"
              to={localizePath('/docs#quickstart')}
            >
              {landing.hero.secondaryCta}
            </Link>
          </div>
          <ul className="landing-trust-row" aria-label={locale === 'de' ? 'Fakten' : 'Facts'}>
            {landing.proof.items.map((item) => (
              <li key={item.id}>
                <ProofIcon id={item.id} />
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="landing-container-wide landing-hero-cards">
          {landing.hero.productCards.map((card) => (
            <Link
              key={card.id}
              className="landing-product-card"
              to={localizePath(`/#feature-${card.id}`)}
            >
              <div className="landing-product-card-copy">
                <h2 className="landing-product-card-title">{card.title}</h2>
                <p className="landing-product-card-sub">{card.subtitle}</p>
                <span className="landing-product-card-link">
                  {locale === 'de' ? 'Mehr erfahren' : 'Learn more'}
                  <ArrowRight size={16} aria-hidden />
                </span>
              </div>
              <div className="landing-product-card-media">
                <div className="landing-product-card-frame">
                  <img
                    className={`landing-product-card-img landing-product-card-img--${card.screenshotId}`}
                    src={screenshotSrc(`${card.screenshotId}-${assetKey}`)}
                    alt={card.imageAlt}
                    width={720}
                    height={450}
                    loading="eager"
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="landing-band landing-band-light landing-section" aria-labelledby="features-heading">
        <div className="site-container">
        <p className="landing-kicker landing-kicker-muted">{landing.featuresSection.kicker}</p>
        <h2 id="features-heading" className="landing-section-title landing-section-title-wide">
          {landing.featuresSection.heading}
        </h2>
        <p className="section-lead landing-section-lead">{landing.featuresSection.lead}</p>
        <div className="feature-grid landing-feature-grid">
          {landing.features.map((feature, index) => (
            <article
              key={feature.id}
              id={`feature-${feature.id}`}
              className={`feature-row landing-feature-row${index % 2 === 1 ? ' feature-row-reverse' : ''}`}
            >
              <div className="feature-copy">
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
                <ul className="landing-feature-bullets">
                  {feature.bullets.map((bullet) => (
                    <li key={bullet}>
                      <Check size={18} strokeWidth={2.5} className="landing-check-icon" aria-hidden />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {feature.marketingScreenshot !== false ? (
                <div
                  className={`feature-shot landing-feature-shot landing-feature-shot--${featureScreenshotBase(feature.id)}`}
                >
                  <img
                    src={screenshotSrc(`${featureScreenshotBase(feature.id)}-${assetKey}`)}
                    alt={feature.imageAlt}
                    width={980}
                    loading="lazy"
                  />
                </div>
              ) : null}
            </article>
          ))}
        </div>
        </div>
      </section>

      <section className="landing-band landing-band-light landing-section landing-steps-section" aria-labelledby="steps-heading">
        <div className="site-container">
        <h2 id="steps-heading" className="landing-section-title landing-section-title-wide">
          {landing.steps.heading}
        </h2>
        <div className="steps-grid landing-steps-grid">
          {landing.steps.items.map((step) => (
            <div key={step.title} className="step-card card landing-step-card">
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          ))}
        </div>
        </div>
      </section>

      <section className="landing-band landing-band-tint landing-dev-band" aria-labelledby="dev-heading">
        <div className="site-container landing-dev-grid">
          <div className="landing-dev-copy">
            <h2 id="dev-heading" className="landing-section-title landing-section-title-wide">
              {landing.developers.heading}
            </h2>
            <p className="section-lead">{landing.developers.body}</p>
            <div className="hero-actions">
              <Link className="btn btn-primary landing-btn-primary" to={localizePath('/docs/api')}>
                {landing.developers.primaryCta}
              </Link>
              <Link className="btn btn-secondary" to={localizePath('/docs/sdks')}>
                {landing.developers.secondaryCta}
              </Link>
            </div>
          </div>
          <div className="landing-code-slot">
            <CodeBlock
              code={landing.developers.installSnippet}
              language="shell"
              highlightKey={`${locale}.landing.developers.install`}
              copyLabel={content.sdks.copyCode}
              copiedLabel={content.sdks.copiedCode}
            />
            <CodeBlock
              code={landing.developers.code}
              language="typescript"
              highlightKey={`${locale}.landing.developers`}
              filename="src/docuvate.ts"
              copyLabel={content.sdks.copyCode}
              copiedLabel={content.sdks.copiedCode}
            />
          </div>
        </div>
      </section>

      <section className="landing-band landing-band-tint landing-section" aria-labelledby="integrations-heading">
        <div className="site-container">
        <h2 id="integrations-heading" className="landing-section-title landing-section-title-wide">
          {landing.integrations.heading}
        </h2>
        <p className="section-lead">{landing.integrations.lead}</p>
        <div className="integration-grid landing-integration-grid">
          {landing.integrations.items.map((item) => (
            <article key={item.id} className="integration-card landing-integration-card">
              <div className="integration-logo-tile" aria-hidden>
                <img
                  className="integration-logo"
                  src={LOGO_MAP[item.id] ?? '/plugin-logos/amazons3.svg'}
                  alt=""
                  width={28}
                  height={28}
                />
              </div>
              <div className="integration-card-body">
                <div className="integration-card-head">
                  <h3>{item.name}</h3>
                  <span className="badge badge-ok">{integrationAvailableLabel(locale)}</span>
                </div>
                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
        </div>
      </section>

      <section className="landing-band landing-band-dark" id="self-hosting" aria-labelledby="closing-cta-heading">
        <div className="site-container landing-closing-cta">
          <h2 id="closing-cta-heading" className="landing-section-title landing-section-title-on-dark">
            {landing.closingCta.heading}
          </h2>
          <p className="landing-closing-lead landing-closing-body">{landing.closingCta.body}</p>
          {landing.closingCta.note ? (
            <p className="landing-closing-note">{landing.closingCta.note}</p>
          ) : null}
          <div className="hero-actions landing-closing-actions">
            <Link className="btn btn-primary btn-lg landing-btn-primary" to={localizePath('/docs#quickstart')}>
              {landing.closingCta.primaryCta}
            </Link>
            <a className="btn btn-secondary btn-lg landing-btn-on-dark" href={GITHUB_URL} target="_blank" rel="noreferrer">
              {landing.closingCta.secondaryCta}
            </a>
          </div>
        </div>
      </section>

      <section className="landing-band landing-band-light landing-section landing-faq-section" aria-labelledby="faq-heading">
        <div className="site-container">
        <h2 id="faq-heading" className="landing-section-title landing-section-title-wide">
          {landing.faq.heading}
        </h2>
        <div className="faq-list">
          {landing.faq.items.map((item) => (
            <FaqItem key={item.question} question={item.question} answer={item.answer} />
          ))}
        </div>
        </div>
      </section>
    </div>
  );
}
