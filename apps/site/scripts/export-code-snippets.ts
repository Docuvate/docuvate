import { deContent } from '../src/content/de';
import { enContent } from '../src/content/en';
import type { SiteContent } from '../src/content/types';

export type CodeSnippetExport = {
  key: string;
  lang: string;
  code: string;
};

function langForInstall(language: 'typescript' | 'dart' | 'yaml'): string {
  switch (language) {
    case 'typescript':
      return 'typescript';
    case 'dart':
      return 'dart';
    case 'yaml':
      return 'yaml';
    default: {
      const _never: never = language;
      return _never;
    }
  }
}

function collect(locale: string, content: SiteContent): CodeSnippetExport[] {
  const out: CodeSnippetExport[] = [];

  out.push({
    key: `${locale}.landing.developers.install`,
    lang: 'shell',
    code: content.landing.developers.installSnippet,
  });

  out.push({
    key: `${locale}.landing.developers`,
    lang: 'typescript',
    code: content.landing.developers.code,
  });

  for (const pkg of [content.sdks.node, content.sdks.flutter]) {
    const installLang =
      pkg.installSnippetLanguage === 'yaml'
        ? 'yaml'
        : pkg.installSnippet.trim().startsWith('pnpm')
          ? 'shell'
          : langForInstall(pkg.installSnippetLanguage);
    out.push({
      key: `${locale}.sdks.${pkg.id}.install`,
      lang: installLang,
      code: pkg.installSnippet,
    });
    pkg.examples.forEach((ex, index) => {
      out.push({
        key: `${locale}.sdks.${pkg.id}.example.${index}`,
        lang: ex.language === 'dart' ? 'dart' : 'typescript',
        code: ex.code,
      });
    });
  }

  return out;
}

const snippets = [...collect('de', deContent), ...collect('en', enContent)];
process.stdout.write(JSON.stringify(snippets));
