import type { CompareCell, CompareRow } from '../lib/compareData';

type CompareCriteriaTableProps = {
  legend: string;
  docuvateLabel: string;
  otherLabel: string;
  rows: CompareRow[];
};

function formatCell(cell: CompareCell): string {
  const src = cell.sources?.trim();
  if (!src) return cell.text;
  const refs = src
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((code) => `[${code}]`)
    .join(' ');
  return `${cell.text} ${refs}`;
}

export function CompareCriteriaTable({ legend, docuvateLabel, otherLabel, rows }: CompareCriteriaTableProps) {
  return (
    <div className="compare-table-block">
      <p className="compare-legend">{legend}</p>
      <div className="compare-table-wrap">
        <table className="compare-table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Kriterium</th>
              <th scope="col">{docuvateLabel}</th>
              <th scope="col">{otherLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <th scope="row">{row.id}</th>
                <td>{row.criterion}</td>
                <td>{formatCell(row.docuvate)}</td>
                <td>{formatCell(row.other)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
