import type { CompareCell } from '../lib/compareData';

type OverviewRow = {
  id: string;
  criterion: string;
  cells: Record<string, CompareCell>;
};

type CompareOverviewMatrixProps = {
  legend: string;
  toolNames: Record<string, string>;
  toolOrder: string[];
  rows: OverviewRow[];
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

export function CompareOverviewMatrix({ legend, toolNames, toolOrder, rows }: CompareOverviewMatrixProps) {
  return (
    <div className="compare-table-block">
      <p className="compare-legend">{legend}</p>
      <div className="compare-table-wrap compare-table-wrap-wide">
        <table className="compare-table compare-table-matrix">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Kriterium</th>
              {toolOrder.map((key) => (
                <th key={key} scope="col">{toolNames[key] ?? key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <th scope="row">{row.id}</th>
                <td>{row.criterion}</td>
                {toolOrder.map((key) => (
                  <td key={key}>{formatCell(row.cells[key] ?? { text: '', sources: '' })}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
