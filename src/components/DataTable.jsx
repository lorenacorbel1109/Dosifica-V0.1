import React from 'react';

/**
 * Tabla genérica de solo lectura para el dashboard.
 */
const DataTable = ({ columns = [], rows = [], emptyMessage = 'Sin datos.' }) => {
  if (!rows.length) {
    return <p style={{ color: '#777', margin: 0 }}>{emptyMessage}</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd', whiteSpace: 'nowrap' }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.id || row.auditId || row.decisionId || `row-${rowIndex}`}>
              {columns.map((column) => (
                <td key={`${column.key}-${rowIndex}`} style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>
                  {column.render ? column.render(row) : row[column.key] ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
