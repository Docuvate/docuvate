import { compareSourceById } from '../lib/compareData';

type CompareSourceTextProps = {
  text: string;
  sources: string;
};

export function CompareSourceText({ text, sources }: CompareSourceTextProps) {
  const codes = sources
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((code) => {
      const entry = compareSourceById(code);
      return Boolean(entry?.url);
    });

  return (
    <>
      {text}
      {codes.length > 0 ? (
        <>
          {' '}
          {codes.map((code, index) => {
            const entry = compareSourceById(code);
            if (!entry) return null;
            return (
              <span key={code}>
                <a
                  className="compare-source-ref"
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={entry.label}
                >
                  [{code}]
                </a>
                {index < codes.length - 1 ? ' ' : null}
              </span>
            );
          })}
        </>
      ) : null}
    </>
  );
}
