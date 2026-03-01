import { useState } from 'react';

const isVisualRule = (rule) => Array.isArray(rule?.clinicalVariables);

const TypeBadge = ({ visual }) => (
  <span
    style={{
      display: 'inline-block',
      borderRadius: 999,
      padding: '2px 8px',
      fontSize: 12,
      fontWeight: 700,
      background: visual ? '#dcfce7' : '#e5e7eb',
      color: visual ? '#166534' : '#374151',
    }}
  >
    {visual ? 'Visual' : 'Código'}
  </span>
);

/**
 * Lista simple y escalable de reglas clínicas cargadas desde estado global.
 */
const RuleList = ({ rules, onEdit, onDelete }) => {
  const [visibleCount, setVisibleCount] = useState(20);

  if (!rules.length) {
    return (
      <section style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
        <h3>Reglas registradas</h3>
        <p style={{ color: '#777' }}>Aún no hay reglas creadas.</p>
      </section>
    );
  }

  const visibleRules = rules.slice(0, visibleCount);
  const canShowMore = rules.length > visibleCount;

  return (
    <section style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8, overflowX: 'auto' }}>
      <h3>Reglas registradas ({rules.length})</h3>

      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            <th style={{ textAlign: 'left', padding: 10 }}>Clasificación</th>
            <th style={{ textAlign: 'left', padding: 10 }}>Patología</th>
            <th style={{ textAlign: 'left', padding: 10 }}>Severidad</th>
            <th style={{ textAlign: 'left', padding: 10 }}>Tipo</th>
            <th style={{ textAlign: 'left', padding: 10 }}>Prioridad</th>
            <th style={{ textAlign: 'left', padding: 10 }}>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {visibleRules.map((rule, index) => {
            const classification = rule.result?.classification || rule.diagnosis || 'Sin clasificación';
            const severity = rule.result?.severity || rule.severity || '-';
            const pathology = rule.pathologyId || rule.pathology || '-';
            const visual = isVisualRule(rule);

            return (
              <tr key={rule.id || `${rule.pathology}-${index}`} style={{ borderTop: '1px solid #efefef' }}>
                <td style={{ padding: 10 }}><strong>{classification}</strong></td>
                <td style={{ padding: 10 }}>{pathology}</td>
                <td style={{ padding: 10 }}>{severity}</td>
                <td style={{ padding: 10 }}><TypeBadge visual={visual} /></td>
                <td style={{ padding: 10 }}>{Number(rule.priority || 0)}</td>
                <td style={{ padding: 10 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => onEdit(rule)}>
                      Editar
                    </button>
                    <button type="button" onClick={() => onDelete(rule)}>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {canShowMore && (
        <div style={{ marginTop: 10 }}>
          <button type="button" onClick={() => setVisibleCount((prev) => prev + 20)}>
            Mostrar más
          </button>
        </div>
      )}
    </section>
  );
};

export default RuleList;
