import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

type CodeBlockProps = {
  code: string;
  language: 'typescript' | 'dart' | 'yaml';
  title?: string;
  copyLabel: string;
  copiedLabel: string;
};

export function InlineCode({ children }: { children: string }) {
  return <code className="inline-code">{children}</code>;
}

function languageLabel(language: CodeBlockProps['language']): string {
  switch (language) {
    case 'typescript':
      return 'TypeScript';
    case 'dart':
      return 'Dart';
    case 'yaml':
      return 'YAML';
    default: {
      const _never: never = language;
      return _never;
    }
  }
}

export function CodeBlock({ code, language, title, copyLabel, copiedLabel }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <figure className="code-panel">
      {title ? <figcaption className="code-panel-example-title">{title}</figcaption> : null}
      <div className="code-panel-shell">
        <div className="code-panel-header">
          <span className="code-panel-lang">{languageLabel(language)}</span>
          <button
            type="button"
            className="code-panel-copy"
            onClick={() => void copy()}
            aria-label={copyLabel}
          >
            {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
            <span>{copied ? copiedLabel : copyLabel}</span>
          </button>
        </div>
        <pre className="code-panel-body">
          <code>{code}</code>
        </pre>
      </div>
    </figure>
  );
}
