import React, { useMemo, useState } from 'react';
import { useAuditStore } from '../store/auditStore.jsx';
import { useDecisionLogStore } from '../store/decisionLogStore.jsx';
import { useAppModeStore } from '../store/appModeStore.jsx';

/**
 * Panel para confirmar/modificar decisiones sugeridas por el sistema.
 */
const DecisionPanel = () => {
  const { auditLogs } = useAuditStore();
  const { decisions, addDecision, clearDecisions, exportDecisionsJson } = useDecisionLogStore();
  const { isSimulation } = useAppModeStore();

  const latestAudit = auditLogs.find((entry) => entry.diagnosis) || null;

  const [clinicianId, setClinicianId] = useState('');
  const [diagnosisFinal, setDiagnosisFinal] = useState('');
  const [treatmentFinal, setTreatmentFinal] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');

  const suggested = useMemo(() => {
    if (!latestAudit) {
      return {
        auditId: '',
        diagnosisSuggested: '',
        treatmentSuggested: '',
      };
    }

    return {
      auditId: latestAudit.auditId || '',
      diagnosisSuggested: latestAudit.diagnosis || '',
      treatmentSuggested: latestAudit.medication || '',
    };
  }, [latestAudit]);

  const handleAcceptSuggested = () => {
    setDiagnosisFinal(suggested.diagnosisSuggested);
    setTreatmentFinal(suggested.treatmentSuggested);
  };

  const handleConfirm = () => {
    if (isSimulation) {
      setMessage('Modo simulación activo: no se registran decisiones.');
      return;
    }

    if (!suggested.auditId) {
      setMessage('No existe sugerencia auditada para confirmar.');
      return;
    }

    if (!diagnosisFinal.trim() || !treatmentFinal.trim()) {
      setMessage('Diagnóstico final y tratamiento final son obligatorios para confirmar.');
      return;
    }

    addDecision({
      auditId: suggested.auditId,
      clinicianId: clinicianId.trim() || 'SIN_CLINICIAN_ID',
      diagnosisSuggested: suggested.diagnosisSuggested,
      diagnosisFinal: diagnosisFinal.trim(),
      treatmentSuggested: suggested.treatmentSuggested,
      treatmentFinal: treatmentFinal.trim(),
      notes: notes.trim(),
      confirmedAt: new Date().toISOString(),
    });

    setMessage('Decisión clínica confirmada y registrada.');
    setNotes('');
  };

  const handleExport = () => {
    const payload = exportDecisionsJson();
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'clinical-decision-log.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, display: 'grid', gap: 10 }}>
      <h2 style={{ marginTop: 0 }}>Clinical Decision Log</h2>

      {isSimulation && (
        <div style={{ border: '1px solid #ffb300', background: '#fff8e1', borderRadius: 8, padding: 8 }}>
          Modo simulación: panel solo informativo, sin persistencia de decisiones.
        </div>
      )}

      {message && (
        <div style={{ border: '1px solid #8bc34a', background: '#f1f8e9', borderRadius: 8, padding: 8 }}>
          {message}
        </div>
      )}

      {!latestAudit ? (
        <p style={{ color: '#777' }}>No hay sugerencias auditadas disponibles todavía.</p>
      ) : (
        <>
          <div style={{ fontSize: 13, background: '#f7f7f7', borderRadius: 8, padding: 8 }}>
            <strong>AuditId:</strong> {suggested.auditId} | <strong>Diagnóstico sugerido:</strong>{' '}
            {suggested.diagnosisSuggested || '-'} | <strong>Tratamiento sugerido:</strong>{' '}
            {suggested.treatmentSuggested || '-'}
          </div>

          <label>
            Clinician ID (si existe autenticación)
            <input value={clinicianId} onChange={(e) => setClinicianId(e.target.value)} placeholder="Ej: CMP-12345" />
          </label>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={handleAcceptSuggested}>
              Aceptar sugerencia del sistema
            </button>
          </div>

          <label>
            Diagnóstico final (acepta/modifica)
            <input value={diagnosisFinal} onChange={(e) => setDiagnosisFinal(e.target.value)} />
          </label>

          <label>
            Tratamiento final (acepta/modifica)
            <input value={treatmentFinal} onChange={(e) => setTreatmentFinal(e.target.value)} />
          </label>

          <label>
            Observaciones adicionales
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>

          <button type="button" onClick={handleConfirm} disabled={isSimulation}>
            Confirmar decisión y guardar
          </button>
        </>
      )}

      <section style={{ borderTop: '1px solid #eee', paddingTop: 8 }}>
        <h3 style={{ marginTop: 0 }}>Registros de decisiones ({decisions.length})</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button type="button" onClick={handleExport} disabled={isSimulation}>
            Exportar Decision Log JSON
          </button>
          <button type="button" onClick={clearDecisions} disabled={isSimulation}>
            Limpiar Decision Log
          </button>
        </div>
        {decisions.length ? (
          <pre style={{ margin: 0, background: '#f8f8f8', borderRadius: 8, padding: 12, maxHeight: 300, overflowX: 'auto' }}>
            {JSON.stringify(decisions, null, 2)}
          </pre>
        ) : (
          <p style={{ color: '#777' }}>Sin decisiones confirmadas.</p>
        )}
      </section>
    </section>
  );
};

export default DecisionPanel;
