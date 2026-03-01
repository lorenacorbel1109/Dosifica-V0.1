import React from 'react';
import { useAuditStore } from '../store/auditStore.jsx';
import { useAppModeStore } from '../store/appModeStore.jsx';

/**
 * Visualizador de auditoría clínica con exportación JSON.
 */
const AuditViewer = () => {
  const { auditLogs, clearAuditLogs, exportAuditJson } = useAuditStore();
  const { isSimulation } = useAppModeStore();

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
        <pre
          style={{
            margin: 0,
            background: '#f8f8f8',
            borderRadius: 8,
            padding: 12,
            overflowX: 'auto',
            maxHeight: 360,
          }}
        >
          {JSON.stringify(auditLogs, null, 2)}
        </pre>
      )}
    </section>
  );
};

export default AuditViewer;
