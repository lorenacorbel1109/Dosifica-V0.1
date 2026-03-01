import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { setNestedValue } from '../utils/helpers.js';
import { PATHOLOGY_CATEGORIES, PATHOLOGY_TEMPLATES } from '../data/pathologyTemplates.js';
import { useMediaQuery } from '../hooks/useMediaQuery.js';
import ClinicalFlowchart from './flowchart/ClinicalFlowchart.jsx';
import useMemoizedEngine from '../hooks/useMemoizedEngine.js';
import styles from './ClinicalEvaluator.module.css';

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

const PATHOLOGY_ICONS = {
  deshidratacion: '💧',
  dengue: '🦟',
  ira_neumonia: '🫁',
  crisis_hipertensiva: '🫀',
  convulsion: '⚡',
  anemia: '🩸',
  desnutricion: '🍽️',
  eda: '🚰',
  ira_alta: '🤧',
  itu: '🧫',
  hipertension: '📈',
  diabetes: '🍬',
  parasitosis: '🪱',
  tuberculosis_screening: '🫧',
  salud_materna: '🤰',
};

const createInitialPatient = () => ({
  edad: '',
  peso: '',
  sexo: 'F',
  selectedSigns: [],
  labRows: [
    { id: crypto.randomUUID(), key: 'hemoglobina', value: '' },
    { id: crypto.randomUUID(), key: 'sodio', value: '' },
  ],
  dynamicValues: {},
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

const ClinicalEvaluator = ({ onEditRelatedRules = () => {} }) => {
  const { evaluableRules, activeNtsVersion } = useClinicalStore();
  const { activeEstablishment, inventoryForActiveEstablishment } = useEstablishmentsStore();
  const { activeNationalMedications } = useNationalMedicationsStore();
  const { addAuditEntries, addResponsibilityAcceptance, auditLogs } = useAuditStore();
  const { addDecision } = useDecisionLogStore();
  const { isSimulation, isProduction, operatorId } = useAppModeStore();
  const { evaluatePatient } = useClinicalEngine(evaluableRules);
  const isMobile = useMediaQuery('(max-width: 767px)');

  const [patientForm, setPatientForm] = useState(createInitialPatient());
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState('');
  const [unmetPolicy, setUnmetPolicy] = useState('reference');
  const [responsibilityAccepted, setResponsibilityAccepted] = useState(false);
  const [signSearch, setSignSearch] = useState('');
  const [decisionMessage, setDecisionMessage] = useState('');
  const [selectedPathology, setSelectedPathology] = useState('ALL');
  const [showPathologyStep, setShowPathologyStep] = useState(true);
  const [resultView, setResultView] = useState('form');
  const [flowchartSelection, setFlowchartSelection] = useState(null);
  const [manualResultOverride, setManualResultOverride] = useState(null);

  const pathologyScopedRules = useMemo(() => {
    if (selectedPathology === 'ALL') return evaluableRules;
    return evaluableRules.filter((rule) => (rule.pathology || rule.pathologyId) === selectedPathology);
  }, [evaluableRules, selectedPathology]);

  useEffect(() => {
    setFlowchartSelection(null);
    setManualResultOverride(null);
  }, [selectedPathology]);

  const unifiedVariables = useMemo(() => {
    const uniqueByKey = new Map();
    pathologyScopedRules.forEach((rule) => {
      if (!Array.isArray(rule?.clinicalVariables)) return;
      rule.clinicalVariables.forEach((variable) => {
        if (!variable?.key || uniqueByKey.has(variable.key)) return;
        uniqueByKey.set(variable.key, variable);
      });
    });
    return Array.from(uniqueByKey.values());
  }, [pathologyScopedRules]);

  const patientPreview = useMemo(() => {
    const preview = {
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
    };

    unifiedVariables.forEach((variable) => {
      const rawValue = patientForm.dynamicValues?.[variable.key];
      if (rawValue === undefined || rawValue === null || rawValue === '') return;
      if (!variable.path) return;

      let normalizedValue = rawValue;
      if (variable.type === 'number') {
        const numericValue = Number(rawValue);
        if (Number.isNaN(numericValue)) return;
        normalizedValue = numericValue;
      }

      setNestedValue(preview, variable.path, normalizedValue);
    });

    return preview;
  }, [
    patientForm,
    activeEstablishment,
    activeNationalMedications,
    inventoryForActiveEstablishment,
    unifiedVariables,
  ]);

  const debouncedPatientPreview = useDebounce(patientPreview, 350);
  const memoizedEngine = useMemoizedEngine({
    rules: evaluableRules,
    patientData: debouncedPatientPreview,
    unmetPolicy,
  });

  const filteredSignOptions = useMemo(() => {
    const query = signSearch.trim().toLowerCase();
    if (!query) return SIGN_OPTIONS;
    return SIGN_OPTIONS.filter((sign) => sign.toLowerCase().includes(query));
  }, [signSearch]);

  const progress = useMemo(() => {
    const fixedFilled = [patientForm.edad, patientForm.peso, patientForm.sexo].filter((value) => String(value || '').trim() !== '').length;
    const dynamicFilled = unifiedVariables.filter((variable) => {
      const value = patientForm.dynamicValues?.[variable.key];
      if (Array.isArray(value)) return value.length > 0;
      return String(value ?? '').trim() !== '';
    }).length;
    const total = 3 + unifiedVariables.length;
    const filled = fixedFilled + dynamicFilled;
    const percent = total ? Math.round((filled / total) * 100) : 0;
    return { filled, total, percent };
  }, [patientForm, unifiedVariables]);

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

  const updateDynamicValue = (key, value) => {
    setPatientForm((prev) => ({
      ...prev,
      dynamicValues: {
        ...(prev.dynamicValues || {}),
        [key]: value,
      },
    }));
  };

  const addLabRow = () => {
    setPatientForm((prev) => ({
      ...prev,
      labRows: [...prev.labRows, { id: crypto.randomUUID(), key: '', value: '' }],
    }));
  };

  const removeLabRow = (rowId) => {
    setPatientForm((prev) => ({
      ...prev,
      labRows: prev.labRows.filter((row) => row.id !== rowId),
    }));
  };

  const evaluateNow = useCallback((previewData = patientPreview) => {
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
    setManualResultOverride(null);
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
  }, [
    patientPreview,
    evaluableRules.length,
    activeNtsVersion,
    activeEstablishment,
    evaluatePatient,
    unmetPolicy,
    isSimulation,
    isProduction,
    addAuditEntries,
  ]);

  useEffect(() => {
    evaluateNow(debouncedPatientPreview);
  }, [memoizedEngine.evaluatedAt, debouncedPatientPreview, evaluateNow]);

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
  const displayedPrimaryResult = manualResultOverride || primaryResult;

  const getFirstTreatment = (rule) => {
    if (Array.isArray(rule?.treatmentLines) && rule.treatmentLines.length) {
      const first = [...rule.treatmentLines].sort((a, b) => (a.order || 0) - (b.order || 0))[0];
      return {
        name: first?.medicationName || first?.medicationId || 'Tratamiento no definido',
        mgPorKg: Number(first?.dose?.mgPorKg || 0),
      };
    }

    return {
      name: rule?.treatment?.firstLine || rule?.treatmentPlan?.selectedTreatment || 'Tratamiento no definido',
      mgPorKg: 0,
    };
  };

  const ruleToResult = (rule) => {
    const treatment = getFirstTreatment(rule);
    return {
      diagnosis: rule?.diagnosis || rule?.result?.classification || 'Diagnóstico no definido',
      severity: rule?.severity || rule?.result?.severity || 'No definida',
      treatmentPlan: {
        selectedTreatment: treatment.name,
        dosage: treatment.mgPorKg
          ? { description: `${(treatment.mgPorKg * Number(patientForm.peso || 0)).toFixed(1)} mg (estimado)` }
          : { description: 'No calculada' },
        available: true,
      },
      requiresReferral: Boolean(rule?.requiresHospitalization),
      referralReason: rule?.referralCriteria || '',
      referralCriteria: rule?.referralCriteria || '',
    };
  };

  const handleConfirmDecision = () => {
    setDecisionMessage('');

    if (isSimulation) {
      setDecisionMessage('Modo simulación activo: la decisión no se guarda.');
      return;
    }

    if (!displayedPrimaryResult) {
      setDecisionMessage('No hay resultado clínico para confirmar.');
      return;
    }

    const latestAudit = auditLogs.find((entry) => entry.diagnosis) || null;

    addDecision({
      auditId: latestAudit?.auditId || '',
      clinicianId: operatorId,
      diagnosisSuggested: displayedPrimaryResult.diagnosis || '',
      diagnosisFinal: displayedPrimaryResult.diagnosis || '',
      treatmentSuggested: displayedPrimaryResult.treatmentPlan?.selectedTreatment || '',
      treatmentFinal: displayedPrimaryResult.treatmentPlan?.selectedTreatment || '',
      notes: 'Confirmación rápida desde Evaluación Clínica',
      confirmedAt: new Date().toISOString(),
    });

    setDecisionMessage('Decisión clínica confirmada y enviada al Decision Log.');
  };

  const renderDynamicField = (variable) => {
    const value = patientForm.dynamicValues?.[variable.key];

    if (variable.type === 'multiselect') {
      const selectedValues = Array.isArray(value) ? value : [];
      return (
        <section className={styles.fieldBlock} key={variable.key}>
          <span className={styles.label}>{variable.label || variable.key}</span>
          <div className={styles.chipGroup}>
            {(variable.options || []).map((option) => {
              const active = selectedValues.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  className={`${styles.chip} ${active ? styles.chipActive : ''}`}
                  onClick={() => {
                    const exists = selectedValues.includes(option);
                    updateDynamicValue(
                      variable.key,
                      exists
                        ? selectedValues.filter((item) => item !== option)
                        : [...selectedValues, option],
                    );
                  }}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </section>
      );
    }

    if (variable.type === 'select' && (variable.options || []).length <= 4) {
      return (
        <section className={styles.fieldBlock} key={variable.key}>
          <span className={styles.label}>{variable.label || variable.key}</span>
          <div className={styles.chipGroup}>
            {(variable.options || []).map((option) => (
              <button
                key={option}
                type="button"
                className={`${styles.chip} ${value === option ? styles.chipActive : ''}`}
                onClick={() => updateDynamicValue(variable.key, option)}
              >
                {option}
              </button>
            ))}
          </div>
        </section>
      );
    }

    if (variable.type === 'select') {
      return (
        <label key={variable.key} className={styles.fieldBlock}>
          <span className={styles.label}>{variable.label || variable.key}</span>
          <select className={styles.inputLarge} value={value || ''} onChange={(event) => updateDynamicValue(variable.key, event.target.value)}>
            <option value="">Seleccionar</option>
            {(variable.options || []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      );
    }

    return (
      <label key={variable.key} className={styles.fieldBlock}>
        <span className={styles.label}>{variable.label || variable.key}</span>
        <input
          type={variable.type === 'number' ? 'number' : 'text'}
          className={styles.inputLarge}
          value={value || ''}
          onChange={(event) => updateDynamicValue(variable.key, event.target.value)}
        />
        {variable.path?.includes('presion') ? <span className={styles.unit}>mmHg</span> : null}
      </label>
    );
  };

  return (
    <section className={styles.wrapper}>
      {message && <div className={styles.notice}>{message}</div>}
      {decisionMessage && <div className={styles.info}>{decisionMessage}</div>}

      <section className={styles.layout}>
        <section className={styles.leftCol}>
          <Card title="Paso 1: Selector de patología" variant="default" collapsible>
            <div className={styles.stepHeader}>
              <span>Filtra variables por patología o evalúa todas.</span>
              <button type="button" className={styles.toggleBtn} onClick={() => setShowPathologyStep((prev) => !prev)}>
                {showPathologyStep ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>

            {showPathologyStep && (
              <section className={styles.pathologyCategories}>
                <button
                  type="button"
                  className={`${styles.pathologyCard} ${selectedPathology === 'ALL' ? styles.pathologyCardActive : ''}`}
                  onClick={() => setSelectedPathology('ALL')}
                >
                  <span>🧭</span>
                  <span>Todas las patologías</span>
                </button>

                {['emergencia', 'consulta', 'programa'].map((category) => (
                  <section
                    key={category}
                    className={`${styles.categoryBlock} ${
                      category === 'emergencia'
                        ? styles.categoryEmergencia
                        : category === 'consulta'
                          ? styles.categoryConsulta
                          : styles.categoryPrograma
                    }`}
                  >
                    <strong>{PATHOLOGY_CATEGORIES[category]}</strong>
                    <div className={styles.pathologyGrid}>
                      {PATHOLOGY_TEMPLATES.filter((template) => template.category === category).map((template) => (
                        <button
                          key={template.pathology}
                          type="button"
                          className={`${styles.pathologyCard} ${selectedPathology === template.pathology ? styles.pathologyCardActive : ''}`}
                          onClick={() => setSelectedPathology(template.pathology)}
                        >
                          <span>{PATHOLOGY_ICONS[template.pathology] || '🩺'}</span>
                          <span>{template.label}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </section>
            )}
          </Card>

          <Card title="Paso 2: Ingreso de datos del paciente">
            <section className={styles.progressWrap}>
              <div className={styles.progressTrack}><div className={styles.progressValue} style={{ width: `${progress.percent}%` }} /></div>
              <span className={styles.progressText}>Campos completados: {progress.filled}/{progress.total}</span>
            </section>

            <section className={styles.fixedRow}>
              <label className={styles.fieldBlock}>
                <span className={styles.label}>Edad</span>
                <input type="number" className={styles.inputLarge} value={patientForm.edad} onChange={(e) => updatePatientField('edad', e.target.value)} />
              </label>
              <label className={styles.fieldBlock}>
                <span className={styles.label}>Peso (kg)</span>
                <input type="number" className={styles.inputLarge} value={patientForm.peso} onChange={(e) => updatePatientField('peso', e.target.value)} />
              </label>
            </section>

            <section className={styles.fieldBlock}>
              <span className={styles.label}>Sexo</span>
              <div className={styles.sexButtons}>
                {['F', 'M', 'Otro'].map((sex) => (
                  <button
                    key={sex}
                    type="button"
                    className={`${styles.sexBtn} ${patientForm.sexo === sex ? styles.sexBtnActive : ''}`}
                    onClick={() => updatePatientField('sexo', sex)}
                  >
                    {sex}
                  </button>
                ))}
              </div>
            </section>

            <section className={styles.fieldBlock}>
              <span className={styles.label}>Signos clínicos (compatibilidad reglas antiguas)</span>
              <input
                type="search"
                className={styles.inputLarge}
                value={signSearch}
                onChange={(event) => setSignSearch(event.target.value)}
                placeholder="Buscar signos..."
              />
              <div className={styles.chipGroup}>
                {filteredSignOptions.map((sign) => {
                  const active = patientForm.selectedSigns.includes(sign);
                  return (
                    <button key={sign} type="button" className={`${styles.chip} ${active ? styles.chipActive : ''}`} onClick={() => toggleSign(sign)}>
                      {sign}
                    </button>
                  );
                })}
              </div>
            </section>

            {unifiedVariables.length > 0 && (
              <section className={styles.fieldBlock}>
                <span className={styles.label}>Variables dinámicas ({selectedPathology === 'ALL' ? 'todas' : selectedPathology})</span>
                <div className={styles.dynamicGrid}>{unifiedVariables.map(renderDynamicField)}</div>
              </section>
            )}

            <section className={styles.fieldBlock}>
              <span className={styles.label}>Laboratorio dinámico (compatibilidad reglas antiguas)</span>
              {patientForm.labRows.map((row, index) => (
                <div key={row.id} className={styles.fixedRow}>
                  <input
                    className={styles.inputLarge}
                    value={row.key}
                    placeholder="Parámetro (ej. hemoglobina)"
                    onChange={(event) => updateLabRow(index, 'key', event.target.value)}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                    <input
                      className={styles.inputLarge}
                      value={row.value}
                      placeholder="Valor"
                      onChange={(event) => updateLabRow(index, 'value', event.target.value)}
                    />
                    <button type="button" className={styles.actionBtn} onClick={() => removeLabRow(row.id)}>Quitar</button>
                  </div>
                </div>
              ))}

              <div className={styles.actions}>
                <button type="button" className={styles.actionBtn} onClick={addLabRow}>+ Parámetro</button>
                <label className={styles.fieldBlock} style={{ minWidth: 180 }}>
                  <span className={styles.label}>Política</span>
                  <select className={styles.inputLarge} value={unmetPolicy} onChange={(e) => setUnmetPolicy(e.target.value)}>
                    <option value="reference">Referencia</option>
                    <option value="exclude">Excluir</option>
                  </select>
                </label>
              </div>
            </section>

            <div className={styles.actions}>
              <button type="button" className={styles.actionBtn} onClick={evaluateNow}>Recalcular</button>
              <button type="button" className={styles.actionBtn} onClick={handleConfirmDecision}>Confirmar decisión</button>
              <button type="button" className={styles.actionBtn} onClick={onEditRelatedRules}>Editar reglas relacionadas</button>
            </div>
          </Card>
        </section>

        <section className={styles.rightCol} id="resultado-clinico">
          <Card title="Paso 3: Resultado" variant="default">
            <div className={styles.segmented}>
              <button
                type="button"
                className={`${styles.segmentBtn} ${resultView === 'form' ? styles.segmentBtnActive : ''}`}
                onClick={() => setResultView('form')}
              >
                📋 Formulario
              </button>
              <button
                type="button"
                className={`${styles.segmentBtn} ${resultView === 'flowchart' ? styles.segmentBtnActive : ''}`}
                onClick={() => setResultView('flowchart')}
              >
                🔀 Flujograma
              </button>
            </div>

            {resultView === 'flowchart' ? (
              selectedPathology === 'ALL' ? (
                <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                  Selecciona una patología para ver su flujograma de decisión
                </p>
              ) : (
                <>
                  <ClinicalFlowchart
                    rules={pathologyScopedRules}
                    highlightedDiagnosis={displayedPrimaryResult?.diagnosis || ''}
                    onSelectResult={(rule) => setFlowchartSelection(rule)}
                  />

                  {flowchartSelection && (
                    <section className={styles.bottomSheet}>
                      <h4 style={{ margin: 0 }}>{flowchartSelection.diagnosis || flowchartSelection.result?.classification || 'Diagnóstico'}</h4>
                      <SeverityBadge severity={flowchartSelection.severity || flowchartSelection.result?.severity} />
                      <p style={{ margin: 0 }}><strong>Fármaco 1ra línea:</strong> {getFirstTreatment(flowchartSelection).name}</p>
                      <p style={{ margin: 0 }}>
                        <strong>Dosis calculada:</strong>{' '}
                        {getFirstTreatment(flowchartSelection).mgPorKg && Number(patientForm.peso || 0)
                          ? `${(getFirstTreatment(flowchartSelection).mgPorKg * Number(patientForm.peso || 0)).toFixed(1)} mg`
                          : 'No disponible'}
                      </p>
                      <p style={{ margin: 0 }}><strong>Criterios de referencia:</strong> {flowchartSelection.referralCriteria || '-'}</p>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => {
                          setManualResultOverride(ruleToResult(flowchartSelection));
                          setResultView('form');
                          document.getElementById('resultado-clinico')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                      >
                        Usar este diagnóstico
                      </button>
                    </section>
                  )}
                </>
              )
            ) : !displayedPrimaryResult ? (
              <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Sin diagnóstico probable aún.</p>
            ) : (
              <section style={{ display: 'grid', gap: 10 }}>
                {displayedPrimaryResult.requiresReferral && (
                  <section className={styles.referralBanner}>
                    Referencia requerida: {displayedPrimaryResult.referralReason || displayedPrimaryResult.referralCriteria}
                  </section>
                )}

                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Modo: {isSimulation ? 'Simulación' : 'Producción'}</div>
                <div className={styles.resultDiagnosis}>{displayedPrimaryResult.diagnosis || 'Diagnóstico no disponible'}</div>
                <SeverityBadge severity={displayedPrimaryResult.severity} />

                <div>
                  <strong>Tratamiento</strong>
                  <div style={{ marginTop: 4 }}>{displayedPrimaryResult.treatmentPlan?.selectedTreatment || 'Sin selección'}</div>
                  <div style={{ marginTop: 8 }}>
                    {displayedPrimaryResult.treatmentPlan?.available !== false ? (
                      <span className={styles.medChipOk}>Disponible en establecimiento</span>
                    ) : (
                      <span className={styles.medChipNo}>No disponible en establecimiento</span>
                    )}
                  </div>
                </div>

                <div className={styles.resultDose}>
                  <strong>Dosis destacada</strong>
                  <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700 }}>
                    {displayedPrimaryResult.treatmentPlan?.dosage?.description || 'No calculada'}
                  </div>
                </div>

                <button type="button" className={styles.actionBtn} onClick={() => setResultView('flowchart')}>
                  Ver en flujograma →
                </button>

                {Boolean(globalAlerts.length) && (
                  <section className={styles.notice}>
                    <strong>Alertas</strong>
                    <ul style={{ margin: '6px 0 0 18px' }}>
                      {globalAlerts.map((alert, index) => (
                        <li key={`alert-${index}`}>{alert}</li>
                      ))}
                    </ul>
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

      {isMobile && (
        <button
          type="button"
          className={`${styles.fab} ${displayedPrimaryResult ? styles.fabPrimary : styles.fabMuted}`}
          onClick={() => {
            if (!displayedPrimaryResult) {
              evaluateNow();
              return;
            }
            document.getElementById('resultado-clinico')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        >
          {displayedPrimaryResult ? 'Ver resultado →' : 'Evaluar'}
        </button>
      )}
    </section>
  );
};

export default ClinicalEvaluator;
