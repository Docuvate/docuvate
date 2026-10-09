// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Braces, Check, Copy, FileCode2, Terminal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import highlights from '../generated/code-highlights.json';
import { useDocuvateTheme } from '../lib/useDocuvateTheme';

type CodeLanguage = 'typescript' | 'dart' | 'yaml' | 'shell';

type CodeBlockProps = {
  code: string;
  language: CodeLanguage;
  /** Stable key matching `src/generated/code-highlights.json` (build script). */
  highlightKey?: string;
  /** Shown in the compact header, e.g. `src/docuvate.ts`. */
  filename?: string;
  title?: string;
  copyLabel: string;
  copiedLabel: string;
};

export function InlineCode({ children }: { children: string }) {
  return <code className="inline-code-chip">{children}</code>;
}

function languageLabel(language: CodeLanguage): string {
  switch (language) {
    case 'typescript':
      return 'TypeScript';
    case 'dart':
      return 'Dart';
    case 'yaml':
      return 'YAML';
    case 'shell':
      return 'Terminal';
    default: {
      const _never: never = language;
      return _never;
    }
  }
}

function LanguageIcon({ language }: { language: CodeLanguage }) {
  const props = { size: 15, strokeWidth: 2, 'aria-hidden': true as const };
  if (language === 'yaml') {
    return <Braces {...props} />;
  }
  if (language === 'shell') {
    return <Terminal {...props} />;
  }
  return <FileCode2 {...props} />;
}

function highlightedHtml(
  key: string | undefined,
  theme: 'light' | 'dark',
  fallback: string
): string {
  if (!key) return fallback;
  const entry = highlights[key as keyof typeof highlights];
  if (!entry) return fallback;
  return theme === 'dark' ? entry.dark : entry.light;
}

export function CodeBlock({
  code,
  language,
  highlightKey,
  filename,
  title,
  copyLabel,
  copiedLabel,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const { theme } = useDocuvateTheme();
  const displayName = filename ?? languageLabel(language);
  const html = highlightedHtml(highlightKey, theme, `<pre><code>${escapeHtml(code)}</code></pre>`);

  useEffect(() => {
    const shell = shellRef.current;
    const body = bodyRef.current;
    if (!shell || !body) {
      return undefined;
    }
    const syncScrollHint = () => {
      shell.dataset.scrollableX = body.scrollWidth > body.clientWidth + 1 ? 'true' : 'false';
    };
    syncScrollHint();
    const observer = new ResizeObserver(syncScrollHint);
    observer.observe(body);
    return () => observer.disconnect();
  }, [code, html, theme]);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <figure className="code-panel">
      {title ? <figcaption className="code-panel-example-title">{title}</figcaption> : null}
      <div
        ref={shellRef}
        className="code-panel-shell"
        data-source-lines={String(code.split('\n').length)}
      >
        <div className="code-panel-header">
          <div className="code-panel-file">
            <LanguageIcon language={language} />
            <span className="code-panel-filename">{displayName}</span>
          </div>
          <button
            type="button"
            className="code-panel-copy"
            onClick={() => void copy()}
            aria-label={copied ? copiedLabel : copyLabel}
          >
            {copied ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />}
          </button>
        </div>
        <div
          ref={bodyRef}
          className="code-panel-body shiki-host"
          // Build-time Shiki HTML (trusted, generated in-repo); must keep outer <pre>.
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </figure>
  );
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
