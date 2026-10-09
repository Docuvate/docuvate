// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { CodeBlock } from '../components/CodeBlock';
import { DocsHeading } from '../components/DocsHeading';
import { DocsPageHeader } from '../components/DocsPageHeader';
import { DocsPageLayout } from '../components/DocsPageLayout';
import { useLocale } from '../context/LocaleContext';
import { RichText } from '../lib/richText';
import type { SdkPackageContent } from '../content/types';

function SdkSection({
  pkg,
  locale,
  copyCode,
  copiedCode,
}: {
  pkg: SdkPackageContent;
  locale: 'de' | 'en';
  copyCode: string;
  copiedCode: string;
}) {
  const baseKey = `${locale}.sdks.${pkg.id}`;
  const installLanguage =
    pkg.installSnippetLanguage === 'yaml'
      ? 'yaml'
      : pkg.installSnippet.trim().startsWith('pnpm')
        ? 'shell'
        : 'typescript';
  const installFilename =
    installLanguage === 'yaml'
      ? 'pubspec.yaml'
      : installLanguage === 'shell'
        ? undefined
        : 'package.json';

  return (
    <>
      <DocsHeading as="h2" id={pkg.id}>
        {pkg.heading}
      </DocsHeading>
      <h3 className="sdk-install-heading">{pkg.installHeading}</h3>
      <p>
        <RichText text={pkg.installBody} />
      </p>
      <CodeBlock
        code={pkg.installSnippet}
        language={installLanguage}
        highlightKey={`${baseKey}.install`}
        filename={installFilename}
        copyLabel={copyCode}
        copiedLabel={copiedCode}
      />
      <p>
        <RichText text={pkg.auth} />
      </p>
      {pkg.examples.map((ex, index) => (
        <CodeBlock
          key={ex.title}
          title={ex.title}
          code={ex.code}
          language={ex.language}
          highlightKey={`${baseKey}.example.${index}`}
          filename={ex.language === 'dart' ? 'lib/docuvate_client.dart' : 'src/docuvate.ts'}
          copyLabel={copyCode}
          copiedLabel={copiedCode}
        />
      ))}
    </>
  );
}

export function DocsSdksPage() {
  const { content, locale } = useLocale();
  const { sdks } = content;

  return (
    <DocsPageLayout>
      <DocsPageHeader title={sdks.meta.title} lead={sdks.pageLead} />

      <p>
        <RichText text={sdks.introRuntimeSpec} />
      </p>
      <p>
        <RichText text={sdks.introCodegenNote} />
      </p>

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
        locale={locale}
        copyCode={sdks.copyCode}
        copiedCode={sdks.copiedCode}
      />
      <SdkSection
        pkg={sdks.flutter}
        locale={locale}
        copyCode={sdks.copyCode}
        copiedCode={sdks.copiedCode}
      />
    </DocsPageLayout>
  );
}
