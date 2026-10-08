import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { InlineCode } from '../components/CodeBlock';
import { useLocale } from '../context/LocaleContext';

const LINK_PARSE = /^\[([^\]]+)\]\(([^)]+)\)$/;

function RichTextSegment({ part }: { part: string }): ReactNode {
  const { localizePath } = useLocale();
  if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
    return <InlineCode>{part.slice(1, -1)}</InlineCode>;
  }
  const linkMatch = LINK_PARSE.exec(part);
  if (linkMatch) {
    const label = linkMatch[1] ?? '';
    const href = linkMatch[2] ?? '';
    if (href.startsWith('/')) {
      return <Link to={localizePath(href)}>{label}</Link>;
    }
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {label}
      </a>
    );
  }
  return part;
}

/** Renders customer copy with `inline code` and [markdown links](/path). */
export function RichText({ text }: { text: string }): ReactNode {
  const parts = text.split(/(`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={index}>
          <RichTextSegment part={part} />
        </Fragment>
      ))}
    </>
  );
}
