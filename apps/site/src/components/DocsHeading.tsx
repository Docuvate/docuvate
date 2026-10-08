import { Link2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { slugifyHeading } from '../lib/slugify';
import { setLocationHash, scrollToHeading } from '../lib/scrollToHeading';

type DocsHeadingProps = {
  as: 'h2' | 'h3';
  id?: string;
  children: ReactNode;
};

function headingText(children: ReactNode): string {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map((c) => (typeof c === 'string' ? c : '')).join('');
  return '';
}

export function DocsHeading({ as: Tag, id: idProp, children }: DocsHeadingProps) {
  const id = idProp ?? slugifyHeading(headingText(children));
  const anchorLabel = typeof children === 'string' ? children : id;

  function onAnchorClick(event: React.MouseEvent) {
    event.preventDefault();
    scrollToHeading(id);
    setLocationHash(id);
  }

  return (
    <Tag id={id} className={`docs-heading docs-heading-${Tag}`}>
      <a
        className="docs-heading-anchor"
        href={`#${id}`}
        aria-label={anchorLabel}
        onClick={onAnchorClick}
      >
        <Link2 size={15} aria-hidden />
      </a>
      <span className="docs-heading-text">{children}</span>
    </Tag>
  );
}
