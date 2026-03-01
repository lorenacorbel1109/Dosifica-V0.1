import { useState } from 'react';
import { useAuditStore } from '../store/auditStore.jsx';
import { useAppModeStore } from '../store/appModeStore.jsx';

/**
 * Visualizador de auditoría clínica con exportación JSON.
 */
const AuditViewer = () => {
  const { auditLogs, clearAuditLogs, exportAuditJson } = useAuditStore();
  const { isSimulation } = useAppModeStore();
  const [visibleCount, setVisibleCount] = useState(20);

  const handleExport = () => {
    const payload = exportAuditJson();
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'clinical-audit.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const visibleAuditLogs = auditLogs.slice(0, visibleCount);
  const canShowMore = auditLogs.length > visibleCount;

  return (
    <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
      <h2 style={{ marginTop: 0 }}>Auditoría clínica</h2>

      {isSimulation && (
        <div style={{ border: '1px solid #ffb300', background: '#fff8e1', borderRadius: 8, padding: 8, marginBottom: 8 }}>
          Modo simulación: auditoría desactivada para entrenamiento.
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button type="button" onClick={handleExport} disabled={isSimulation}>
          Exportar auditoría JSON
        </button>
        <button type="button" onClick={clearAuditLogs} disabled={isSimulation}>
          Limpiar auditoría
        </button>
      </div>

      {!auditLogs.length ? (
        <p style={{ color: '#777' }}>Sin registros de auditoría.</p>
      ) : (
        <section style={{ display: 'grid', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
          {visibleAuditLogs.map((log) => (
            <article key={log.auditId || `${log.timestamp}-${log.diagnosis || 'audit'}`} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 8, background: '#f8fafc' }}>
              <div style={{ fontSize: 12, color: '#334155' }}>
                {log.timestamp || '-'} · {log.establishmentId || 'N/A'}
              </div>
              <div><strong>{log.diagnosis || 'Sin diagnóstico'}</strong></div>
              {Array.isArray(log.alerts) && log.alerts.length > 0 && (
                <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                  {log.alerts.slice(0, 3).map((alert) => (
                    <li key={alert} style={{ fontSize: 12 }}>{alert}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}
          {canShowMore && (
            <div>
              <button type="button" onClick={() => setVisibleCount((prev) => prev + 20)}>
                Mostrar más
              </button>
            </div>
          )}
        </section>
      )}
    </section>
  );
};

export default AuditViewer;
