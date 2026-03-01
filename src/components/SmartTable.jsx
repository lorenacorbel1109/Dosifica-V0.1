import React, { useMemo, useState } from 'react';

const DEFAULT_PAGE_SIZE = 20;

/**
 * Tabla compacta con ordenamiento, filtro y paginación.
 */
const SmartTable = ({
  columns,
  rows,
  emptyMessage = 'Sin datos.',
  filterText = '',
  pageSize = DEFAULT_PAGE_SIZE,
  maxHeight = 360,
  compact = false,
}) => {
  const [sortKey, setSortKey] = useState(columns[0]?.key || '');
  const [sortDirection, setSortDirection] = useState('asc');
  const [page, setPage] = useState(1);

  const filteredRows = useMemo(() => {
    const normalizedFilter = filterText.trim().toLowerCase();
    if (!normalizedFilter) return rows;

    return rows.filter((row) =>
      columns.some((column) => String(row[column.key] ?? '').toLowerCase().includes(normalizedFilter)),
    );
  }, [rows, columns, filterText]);

  const sortedRows = useMemo(() => {
    if (!sortKey) return filteredRows;

    const next = [...filteredRows].sort((left, right) => {
      const leftValue = String(left[sortKey] ?? '');
      const rightValue = String(right[sortKey] ?? '');
      return leftValue.localeCompare(rightValue, 'es', { numeric: true, sensitivity: 'base' });
    });

    return sortDirection === 'asc' ? next : next.reverse();
  }, [filteredRows, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const currentRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [safePage, pageSize, sortedRows]);

  const onSort = (key) => {
    if (key === sortKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDirection('asc');
  };

  if (!rows.length) {
    return <p style={{ color: '#6b7280', margin: 0 }}>{emptyMessage}</p>;
  }

  const padding = compact ? 6 : 8;
  const fontSize = compact ? 12 : 13;

  return (
    <section style={{ display: 'grid', gap: 8 }}>
      <div style={{ overflowX: 'auto', maxHeight, border: '1px solid #dbe2ef', borderRadius: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize }}>
          <thead style={{ position: 'sticky', top: 0, background: '#eef2ff' }}>
            <tr>
              {columns.map((column) => (
                <th key={column.key} style={{ textAlign: 'left', padding, whiteSpace: 'nowrap' }}>
                  <button
                    type="button"
                    onClick={() => onSort(column.key)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: compact ? 11 : 12,
                      fontWeight: 700,
                    }}
                  >
                    {column.label} {sortKey === column.key ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentRows.map((row, rowIndex) => (
              <tr key={`${rowIndex}-${row.id || rowIndex}`}>
                {columns.map((column) => (
                  <td key={`${column.key}-${rowIndex}`} style={{ borderTop: '1px solid #e5e7eb', padding }}>
                    {column.render ? column.render(row[column.key], row) : row[column.key] ?? '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedRows.length > pageSize && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={() => setPage((prev) => Math.max(1, prev - 1))} style={{ fontSize: 12 }}>
            Anterior
          </button>
          <span style={{ fontSize: 12 }}>Página {safePage} / {totalPages}</span>
          <button type="button" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} style={{ fontSize: 12 }}>
            Siguiente
          </button>
        </div>
      )}
    </section>
  );
};

export default SmartTable;
