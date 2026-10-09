import { DocsPageLayout } from '../components/DocsPageLayout';
import { DocsHeading } from '../components/DocsHeading';
import { DocsPageHeader } from '../components/DocsPageHeader';
import type { DocGuidePage } from '../content/docs-extended/types';
import { RichText } from '../lib/richText';

type DocsGuidePageProps = {
  page: DocGuidePage;
};

export function DocsGuidePageView({ page }: DocsGuidePageProps) {
  return (
    <DocsPageLayout>
      <DocsPageHeader title={page.title} lead={page.lead} />
      {page.ownerPlaceholder ? (
        <section className="docs-owner-placeholder" aria-label={page.ownerPlaceholder.heading}>
          <DocsHeading as="h2" id="owner-placeholder">
            {page.ownerPlaceholder.heading}
          </DocsHeading>
          <p className="docs-owner-placeholder-body">{page.ownerPlaceholder.body}</p>
        </section>
      ) : null}
      {page.sections.map((section) => (
        <section key={section.id}>
          <DocsHeading as="h2" id={section.id}>
            {section.heading}
          </DocsHeading>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>
              <RichText text={paragraph} />
            </p>
          ))}
          {section.bullets?.length ? (
            <ul>
              {section.bullets.map((item) => (
                <li key={item}>
                  <RichText text={item} />
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </DocsPageLayout>
  );
}
