import React, { useEffect, useMemo, useState } from 'react';
import useClinicalEngine from '../hooks/useClinicalEngine.js';
import { useClinicalStore } from '../store/clinicalStore.jsx';
import { useEstablishmentsStore } from '../store/establishmentsStore.jsx';
import { useNationalMedicationsStore } from '../store/nationalMedicationsStore.jsx';
import { useAuditStore } from '../store/auditStore.jsx';
import { useDecisionLogStore } from '../store/decisionLogStore.jsx';
import { buildAuditEntries } from '../audit/auditLogger.js';
import ResponsibilityGate from './ResponsibilityGate.jsx';
import { useAppModeStore } from '../store/appModeStore.jsx';
import Card from './Card.jsx';
import SeverityBadge from './SeverityBadge.jsx';
import { useDebounce } from '../hooks/useDebounce.js';

const SIGN_OPTIONS = [
  'mucosas secas',
  'ojos hundidos',
  'llenado capilar lento',
  'taquicardia',
  'hipotensión',
  'letargo',
  'pérdida de peso',
  'sed intensa',
];

const createInitialPatient = () => ({
  edad: '',
  peso: '',
  sexo: 'F',
  selectedSigns: [],
  labRows: [
    { key: 'hemoglobina', value: '' },
    { key: 'sodio', value: '' },
  ],
});

const normalizeLabRows = (rows) =>
  rows.reduce((accumulator, row) => {
    const key = row.key.trim();
    if (!key) return accumulator;

    const rawValue = row.value;
    if (rawValue === '') {
      accumulator[key] = undefined;
      return accumulator;
    }

    const numericValue = Number(rawValue);
    accumulator[key] = Number.isNaN(numericValue) ? rawValue : numericValue;
    return accumulator;
  }, {});

/**
 * Evaluador clínico optimizado para ingreso rápido y lectura inmediata.
 */
const ClinicalEvaluator = ({ onEditRelatedRules = () => {} }) => {
  const { rules, evaluableRules, activeNtsVersion } = useClinicalStore();
  const { activeEstablishment, inventoryForActiveEstablishment } = useEstablishmentsStore();
  const { activeNationalMedications } = useNationalMedicationsStore();
  const { addAuditEntries, addResponsibilityAcceptance, auditLogs } = useAuditStore();
  const { addDecision } = useDecisionLogStore();
  const { isSimulation, isProduction } = useAppModeStore();
  const { evaluatePatient } = useClinicalEngine(evaluableRules);

  const [patientForm, setPatientForm] = useState(createInitialPatient());
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState('');
  const [unmetPolicy, setUnmetPolicy] = useState('reference');
  const [responsibilityAccepted, setResponsibilityAccepted] = useState(false);
  const [signSearch, setSignSearch] = useState('');
  const [decisionMessage, setDecisionMessage] = useState('');

  const patientPreview = useMemo(
    () => ({
      edad: Number(patientForm.edad || 0),
      peso: Number(patientForm.peso || 0),
      sexo: patientForm.sexo,
      sintomas: [],
      signos: patientForm.selectedSigns,
      laboratorio: normalizeLabRows(patientForm.labRows),
      establishmentId: activeEstablishment?.id || '',
      nivelResolutivo: activeEstablishment?.level || 'I-1',
      medicamentosDisponibles: activeEstablishment?.medicationsAvailable || [],
      equiposDisponibles: activeEstablishment?.equipmentAvailable || [],
      nationalMedications: activeNationalMedications || [],
      establishmentInventory: inventoryForActiveEstablishment || [],
    }),
    [patientForm, activeEstablishment, activeNationalMedications, inventoryForActiveEstablishment],
  );

  const debouncedPatientPreview = useDebounce(patientPreview, 350);

  const filteredSignOptions = useMemo(() => {
    const query = signSearch.trim().toLowerCase();
    if (!query) return SIGN_OPTIONS;
    return SIGN_OPTIONS.filter((sign) => sign.toLowerCase().includes(query));
  }, [signSearch]);

  const updatePatientField = (field, value) => {
    setPatientForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSign = (sign) => {
    setPatientForm((prev) => {
      const alreadySelected = prev.selectedSigns.includes(sign);
      return {
        ...prev,
        selectedSigns: alreadySelected
          ? prev.selectedSigns.filter((item) => item !== sign)
          : [...prev.selectedSigns, sign],
      };
    });
  };

  const updateLabRow = (index, field, value) => {
    setPatientForm((prev) => ({
      ...prev,
      labRows: prev.labRows.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)),
    }));
  };

  const addLabRow = () => {
    setPatientForm((prev) => ({
      ...prev,
      labRows: [...prev.labRows, { key: '', value: '' }],
    }));
  };

  const removeLabRow = (index) => {
    setPatientForm((prev) => ({
      ...prev,
      labRows: prev.labRows.filter((_, rowIndex) => rowIndex !== index),
    }));
  };

  const evaluateNow = (previewData = patientPreview) => {
    if (!evaluableRules.length) {
      setMessage(`No hay reglas activas para la versión ${activeNtsVersion}.`);
      setResults([]);
      setResponsibilityAccepted(false);
      return;
    }

    if (!activeEstablishment) {
      setMessage('No hay establecimiento activo para evaluar.');
      setResults([]);
      setResponsibilityAccepted(false);
      return;
    }

    setMessage('');
    const evaluation = evaluatePatient(previewData, { unmetPolicy });
    setResults(evaluation);
    setResponsibilityAccepted(isSimulation);

    const patientSnapshot = {
      edad: previewData.edad,
      peso: previewData.peso,
      signos: previewData.signos,
      laboratorio: previewData.laboratorio,
    };

    if (isProduction) {
      const auditEntries = buildAuditEntries({
        engineResults: evaluation,
        patientSnapshot,
        establishmentId: activeEstablishment?.id || '',
        resolutionLevel: activeEstablishment?.level || '',
      });
      addAuditEntries(auditEntries);
    }

    if (!evaluation.length) {
      setMessage('No se encontraron diagnósticos probables con los datos ingresados.');
    }
  };

  useEffect(() => {
    evaluateNow(debouncedPatientPreview);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    rules,
    evaluableRules,
    activeNtsVersion,
    activeEstablishment?.id,
    activeEstablishment?.level,
    activeEstablishment?.medicationsAvailable,
    activeEstablishment?.equipmentAvailable,
    debouncedPatientPreview,
    unmetPolicy,
    isSimulation,
    isProduction,
  ]);

  const globalAlerts = results.flatMap((result) => result.alerts || []).filter(Boolean);

  const gatedResults = useMemo(() => {
    if (responsibilityAccepted) return results;

    return results.map((result) => ({
      ...result,
      treatmentPlan: {
        blocked: true,
        message: 'Plan terapéutico y dosis final bloqueados hasta confirmar responsabilidad clínica.',
      },
    }));
  }, [results, responsibilityAccepted]);

  const primaryResult = gatedResults[0] || null;

  const handleConfirmDecision = () => {
    setDecisionMessage('');

    if (isSimulation) {
      setDecisionMessage('Modo simulación activo: la decisión no se guarda.');
      return;
    }

    if (!primaryResult) {
      setDecisionMessage('No hay resultado clínico para confirmar.');
      return;
    }

    const latestAudit = auditLogs.find((entry) => entry.diagnosis) || null;

    addDecision({
      auditId: latestAudit?.auditId || '',
      clinicianId: 'SIN_CLINICIAN_ID',
      diagnosisSuggested: primaryResult.diagnosis || '',
      diagnosisFinal: primaryResult.diagnosis || '',
      treatmentSuggested: primaryResult.treatmentPlan?.selectedTreatment || '',
      treatmentFinal: primaryResult.treatmentPlan?.selectedTreatment || '',
      notes: 'Confirmación rápida desde Evaluación Clínica',
      confirmedAt: new Date().toISOString(),
    });

    setDecisionMessage('Decisión clínica confirmada y enviada al Decision Log.');
  };

  return (
    <section style={{ display: 'grid', gap: 12 }}>
      {message && (
        <div style={{ border: '1px solid #f0c36d', background: '#fff8e5', borderRadius: 8, padding: 10 }}>
          {message}
        </div>
      )}

      {decisionMessage && (
        <div style={{ border: '1px solid #dbe2ef', background: '#eef6ff', borderRadius: 8, padding: 10 }}>
          {decisionMessage}
        </div>
      )}

      <section
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'minmax(420px, 1.25fr) minmax(320px, 1fr)',
          alignItems: 'start',
        }}
      >
        <Card title="Ingreso rápido del paciente">
          <section style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(90px, 1fr))', gap: 8 }}>
              <label>
                Edad
                <input type="number" value={patientForm.edad} onChange={(e) => updatePatientField('edad', e.target.value)} />
              </label>

              <label>
                Peso (kg)
                <input type="number" value={patientForm.peso} onChange={(e) => updatePatientField('peso', e.target.value)} />
              </label>

              <label>
                Sexo
                <select value={patientForm.sexo} onChange={(e) => updatePatientField('sexo', e.target.value)}>
                  <option value="F">F</option>
                  <option value="M">M</option>
                  <option value="Otro">Otro</option>
                </select>
              </label>
            </div>

            <section style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 8, display: 'grid', gap: 8 }}>
              <strong>Signos clínicos</strong>
              <input
                type="search"
                value={signSearch}
                onChange={(event) => setSignSearch(event.target.value)}
                placeholder="Buscar signos..."
              />

              <div style={{ maxHeight: 170, overflowY: 'auto', display: 'grid', gap: 4, paddingRight: 4 }}>
                {filteredSignOptions.map((sign) => (
                  <label key={sign} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={patientForm.selectedSigns.includes(sign)}
                      onChange={() => toggleSign(sign)}
                    />
                    <span>{sign}</span>
                  </label>
                ))}
              </div>
            </section>

            <section style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 8, display: 'grid', gap: 8 }}>
              <strong>Laboratorio dinámico</strong>
              {patientForm.labRows.map((row, index) => (
                <div key={`lab-row-${index}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8 }}>
                  <input
                    value={row.key}
                    placeholder="Parámetro (ej. hemoglobina)"
                    onChange={(event) => updateLabRow(index, 'key', event.target.value)}
                  />
                  <input
                    value={row.value}
                    placeholder="Valor"
                    onChange={(event) => updateLabRow(index, 'value', event.target.value)}
                  />
                  <button type="button" onClick={() => removeLabRow(index)} style={{ fontSize: 12 }}>
                    Quitar
                  </button>
                </div>
              ))}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" onClick={addLabRow} style={{ fontSize: 12 }}>
                  + Parámetro
                </button>
                <label>
                  Política
                  <select value={unmetPolicy} onChange={(e) => setUnmetPolicy(e.target.value)}>
                    <option value="reference">Referencia</option>
                    <option value="exclude">Excluir</option>
                  </select>
                </label>
              </div>
            </section>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" onClick={evaluateNow}>Recalcular</button>
              <button type="button" onClick={handleConfirmDecision}>Confirmar decisión</button>
              <button type="button" onClick={onEditRelatedRules}>Editar reglas relacionadas</button>
            </div>
          </section>
        </Card>

        <Card title="Resultado clínico en tiempo real">
          {!primaryResult ? (
            <p style={{ margin: 0, color: '#6b7280' }}>Sin diagnóstico probable aún.</p>
          ) : (
            <section style={{ display: 'grid', gap: 8 }}>
              <div style={{ fontSize: 13, color: '#4b5563' }}>Modo: {isSimulation ? 'Simulación' : 'Producción'}</div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, lineHeight: 1.2 }}>
                {primaryResult.diagnosis || 'Diagnóstico no disponible'}
              </div>
              <div>
                <SeverityBadge severity={primaryResult.severity} />
              </div>

              <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 8 }}>
                <strong>Tratamiento</strong>
                <div style={{ marginTop: 4 }}>{primaryResult.treatmentPlan?.selectedTreatment || 'Sin selección'}</div>
              </div>

              <div
                style={{
                  border: '1px solid #bfdbfe',
                  borderRadius: 8,
                  padding: 10,
                  background: '#eff6ff',
                }}
              >
                <strong>Dosis destacada</strong>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                  {primaryResult.treatmentPlan?.dosage?.description || 'No calculada'}
                </div>
              </div>

              {Boolean(globalAlerts.length) && (
                <section style={{ border: '1px solid #fcd34d', background: '#fff8e1', borderRadius: 8, padding: 8 }}>
                  <strong>Alertas</strong>
                  <ul style={{ margin: '6px 0 0 18px' }}>
                    {globalAlerts.map((alert, index) => (
                      <li key={`alert-${index}`}>{alert}</li>
                    ))}
                  </ul>
                </section>
              )}

              {primaryResult.requiresReferral && (
                <section style={{ border: '1px solid #ef4444', background: '#fee2e2', borderRadius: 8, padding: 8 }}>
                  <strong>Referencia requerida</strong>
                  <div>{primaryResult.referralReason || primaryResult.referralCriteria}</div>
                </section>
              )}

              {!responsibilityAccepted && isProduction && (
                <ResponsibilityGate
                  onConfirm={({ simulateMode }) => {
                    setResponsibilityAccepted(true);
                    if (!simulateMode) {
                      addResponsibilityAcceptance({
                        establishmentId: activeEstablishment?.id || '',
                        simulateMode: false,
                      });
                    }
                  }}
                />
              )}
            </section>
          )}
        </Card>
      </section>
    </section>
  );
};

export default ClinicalEvaluator;
