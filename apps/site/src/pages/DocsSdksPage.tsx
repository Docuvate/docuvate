import { CodeBlock } from '../components/CodeBlock';
import { DocsHeading } from '../components/DocsHeading';
import { DocsPageLayout } from '../components/DocsPageLayout';
import { useLocale } from '../context/LocaleContext';
import { RichText } from '../lib/richText';

function SdkSection({
  pkg,
  previewBadge,
  copyCode,
  copiedCode,
}: {
  pkg: ReturnType<typeof useLocale>['content']['sdks']['node'];
  previewBadge: string;
  copyCode: string;
  copiedCode: string;
}) {
  return (
    <>
      <div className="sdk-section-head">
        <DocsHeading as="h2" id={pkg.id}>
          {pkg.heading}
        </DocsHeading>
        {pkg.preview ? <span className="badge badge-preview">{previewBadge}</span> : null}
      </div>
      {pkg.preview ? <p className="sdk-preview-note">{pkg.previewNote}</p> : null}
      <h3 className="sdk-install-heading">{pkg.installHeading}</h3>
      <p>{pkg.installBody}</p>
      <CodeBlock
        code={pkg.installSnippet}
        language={pkg.installSnippetLanguage}
        copyLabel={copyCode}
        copiedLabel={copiedCode}
      />
      <p>
        <RichText text={pkg.auth} />
      </p>
      {pkg.examples.map((ex) => (
        <CodeBlock
          key={ex.title}
          title={ex.title}
          code={ex.code}
          language={ex.language}
          copyLabel={copyCode}
          copiedLabel={copiedCode}
        />
      ))}
    </>
  );
}

export function DocsSdksPage() {
  const { content } = useLocale();
  const { sdks } = content;
  const { overviewTable } = sdks;

  return (
    <DocsPageLayout>
      <h1>{sdks.meta.title}</h1>
      <p>{sdks.introLead}</p>
      <p>
        <RichText text={sdks.introRuntimeSpec} />
      </p>
      <p>
        <RichText text={sdks.introCodegenNote} />
      </p>

      <div className="sdk-overview-table-wrap">
        <table className="sdk-overview-table">
          <thead>
            <tr>
              <th scope="col">{overviewTable.headings.sdk}</th>
              <th scope="col">{overviewTable.headings.package}</th>
              <th scope="col">{overviewTable.headings.status}</th>
              <th scope="col">{overviewTable.headings.section}</th>
            </tr>
          </thead>
          <tbody>
            {overviewTable.rows.map((row) => (
              <tr key={row.sectionId}>
                <td>{row.sdk}</td>
                <td>
                  <code>{row.packageName}</code>
                </td>
                <td>
                  {row.preview ? <span className="badge badge-preview">{sdks.previewBadge}</span> : null}
                </td>
                <td>
                  <a href={`#${row.sectionId}`}>{row.sectionLabel}</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DocsHeading as="h2" id="service-credentials">
        {sdks.serviceCredentials.heading}
      </DocsHeading>
      <p>{sdks.serviceCredentials.body}</p>
      <ol>
        {sdks.serviceCredentials.steps.map((step) => (
          <li key={step}>
            <RichText text={step} />
          </li>
        ))}
      </ol>

      <SdkSection
        pkg={sdks.node}
        previewBadge={sdks.previewBadge}
        copyCode={sdks.copyCode}
        copiedCode={sdks.copiedCode}
      />
      <SdkSection
        pkg={sdks.flutter}
        previewBadge={sdks.previewBadge}
        copyCode={sdks.copyCode}
        copiedCode={sdks.copiedCode}
      />
    </DocsPageLayout>
  );
}
