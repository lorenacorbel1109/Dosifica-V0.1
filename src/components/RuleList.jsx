import React from 'react';

/**
 * Lista simple y escalable de reglas clínicas cargadas desde estado global.
 */
const RuleList = ({ rules, onEdit, onDelete }) => {
  if (!rules.length) {
    return (
      <section style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
        <h3>Reglas registradas</h3>
        <p style={{ color: '#777' }}>Aún no hay reglas creadas.</p>
      </section>
    );
  }

  return (
    <section style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
      <h3>Reglas registradas ({rules.length})</h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {rules.map((rule, index) => {
          const classification = rule.result?.classification || rule.diagnosis || 'Sin clasificación';
          const severity = rule.result?.severity || rule.severity || '-';
          const level = rule.levelRestriction || rule.levelRequired || rule.requiredCareLevel || '-';
          const planName = rule.managementPlan?.name || rule.managementPlanId || '-';
          const meds = Array.isArray(rule.specificMedications) ? rule.specificMedications : (rule.requiredMedications || []);

          return (
            <li
              key={rule.id || `${rule.pathology}-${index}`}
              style={{
                borderBottom: '1px solid #efefef',
                padding: '10px 0',
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div>
                <strong>{classification}</strong>
                <div style={{ fontSize: 13, color: '#555' }}>
                  Patología: {rule.pathologyId || rule.pathology || '-'} | Severidad: {severity}
                </div>
                <div style={{ fontSize: 12, color: '#777' }}>
                  Condiciones: {rule.conditions?.conditions?.length || rule.conditions?.length || 0} | Nivel requerido:{' '}
                  {Array.isArray(level) ? level.join(', ') : level} | Prioridad: {Number(rule.priority || 0)} | Plan: {planName}
                </div>
                <div style={{ fontSize: 12, color: '#777' }}>
                  Medicación específica: {Array.isArray(meds) && meds.length ? meds.join(', ') : '-'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => onEdit(rule)}>
                  Editar
                </button>
                <button type="button" onClick={() => onDelete(rule)}>
                  Eliminar
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default RuleList;
