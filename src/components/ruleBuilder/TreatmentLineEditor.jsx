import { useMemo, useState } from 'react';

const FREQUENCY_SUGGESTIONS = [
  'cada 8 horas',
  'cada 12 horas',
  'cada 24 horas',
  '1 vez al día',
  '2 veces al día',
  '3 veces al día',
  'dosis única',
];

const ORDER_LABELS = {
  1: 'Primera línea',
  2: 'Alternativa',
};

const createEmptyTreatmentLine = (order) => ({
  order,
  medicationId: '',
  medicationName: '',
  dose: {
    mgPorKg: '',
    frecuencia: '',
    dosisMaxima: '',
    unit: 'mg',
    formula: '',
  },
  indications: [],
  notes: '',
});

const normalizeDose = (dose) => ({
  mgPorKg: dose?.mgPorKg ?? '',
  frecuencia: dose?.frecuencia ?? '',
  dosisMaxima: dose?.dosisMaxima ?? '',
  unit: dose?.unit || 'mg',
  formula: dose?.formula || '',
});

const normalizeLine = (line, index) => ({
  ...createEmptyTreatmentLine(index + 1),
  ...line,
  order: line?.order || index + 1,
  dose: normalizeDose(line?.dose),
});

const getMedicationName = (medication) => medication?.genericName || medication?.name || medication?.nombre || '';

const TreatmentLineEditor = ({ treatmentLines, onChange, nationalMedications }) => {
  const normalizedLines = useMemo(
    () => (Array.isArray(treatmentLines) ? treatmentLines : []).map((line, index) => normalizeLine(line, index)),
    [treatmentLines],
  );

  const [medicationQueryByIndex, setMedicationQueryByIndex] = useState({});
  const [showSuggestionsByIndex, setShowSuggestionsByIndex] = useState({});
  const [showFrequencySuggestionsByIndex, setShowFrequencySuggestionsByIndex] = useState({});

  const medications = Array.isArray(nationalMedications) ? nationalMedications : [];

  const emitLines = (nextLines) => {
    const withOrder = nextLines.map((line, index) => ({
      ...line,
      order: index + 1,
      dose: normalizeDose(line.dose),
    }));
    onChange(withOrder);
  };

  const updateLine = (index, updater) => {
    const nextLines = normalizedLines.map((line, rowIndex) => {
      if (rowIndex !== index) return line;
      const nextLine = typeof updater === 'function' ? updater(line) : { ...line, ...updater };
      return normalizeLine(nextLine, index);
    });
    emitLines(nextLines);
  };

  const removeLine = (index) => {
    emitLines(normalizedLines.filter((_, rowIndex) => rowIndex !== index));
  };

  const moveLine = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= normalizedLines.length) return;

    const nextLines = [...normalizedLines];
    const current = nextLines[index];
    nextLines[index] = nextLines[target];
    nextLines[target] = current;
    emitLines(nextLines);
  };

  const addLine = () => {
    const nextOrder = normalizedLines.length + 1;
    emitLines([...normalizedLines, createEmptyTreatmentLine(nextOrder)]);
  };

  const getFilteredMedications = (query) => {
    const normalizedQuery = (query || '').trim().toLowerCase();
    if (!normalizedQuery) return medications.slice(0, 8);

    return medications
      .filter((medication) => getMedicationName(medication).toLowerCase().includes(normalizedQuery))
      .slice(0, 8);
  };

  const getOrderLabel = (order) => ORDER_LABELS[order] || 'Otras opciones';

  return (
    <section style={{ border: '1px solid #d6dae1', borderRadius: 8, overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            <th style={{ textAlign: 'left', padding: 10 }}>Orden</th>
            <th style={{ textAlign: 'left', padding: 10 }}>Fármaco</th>
            <th style={{ textAlign: 'left', padding: 10 }}>mg/kg</th>
            <th style={{ textAlign: 'left', padding: 10 }}>Dosis máx</th>
            <th style={{ textAlign: 'left', padding: 10 }}>Frecuencia</th>
            <th style={{ textAlign: 'left', padding: 10 }}>Unidad</th>
            <th style={{ textAlign: 'left', padding: 10 }}>Notas</th>
            <th style={{ textAlign: 'left', padding: 10 }}>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {normalizedLines.map((line, index) => {
            const rawQuery = medicationQueryByIndex[index];
            const medicationQuery = rawQuery ?? line.medicationName;
            const filteredMedications = getFilteredMedications(medicationQuery);
            const showMedicationSuggestions = !!showSuggestionsByIndex[index] && filteredMedications.length > 0;
            const showFrequencySuggestions = !!showFrequencySuggestionsByIndex[index];
            const numericMgPorKg = Number(line.dose?.mgPorKg);
            const hasDosePreview = line.dose?.mgPorKg !== '' && !Number.isNaN(numericMgPorKg);

            return (
              <React.Fragment key={`${line.medicationId || line.medicationName || 'line'}-${index}`}>
                <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: 10, verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 600 }}>{line.order}</div>
                    <small style={{ color: '#64748b' }}>{getOrderLabel(line.order)}</small>
                  </td>

                  <td style={{ padding: 10, verticalAlign: 'top', position: 'relative' }}>
                    <input
                      type="text"
                      value={medicationQuery}
                      onFocus={() => {
                        setShowSuggestionsByIndex((prev) => ({ ...prev, [index]: true }));
                        setMedicationQueryByIndex((prev) => ({ ...prev, [index]: medicationQuery }));
                      }}
                      onBlur={() => {
                        setTimeout(() => {
                          setShowSuggestionsByIndex((prev) => ({ ...prev, [index]: false }));
                        }, 120);
                      }}
                      onChange={(event) => {
                        const nextName = event.target.value;
                        setMedicationQueryByIndex((prev) => ({ ...prev, [index]: nextName }));
                        setShowSuggestionsByIndex((prev) => ({ ...prev, [index]: true }));

                        const exactMatch = medications.find(
                          (medication) => getMedicationName(medication).toLowerCase() === nextName.trim().toLowerCase(),
                        );

                        updateLine(index, (current) => ({
                          ...current,
                          medicationName: nextName,
                          medicationId: exactMatch?.id || exactMatch?.medicationId || '',
                        }));
                      }}
                      placeholder="Buscar o escribir fármaco"
                      style={{ width: '100%' }}
                    />

                    {showMedicationSuggestions && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 42,
                          left: 10,
                          right: 10,
                          zIndex: 10,
                          border: '1px solid #cbd5e1',
                          borderRadius: 6,
                          background: '#fff',
                          maxHeight: 220,
                          overflowY: 'auto',
                        }}
                      >
                        {filteredMedications.map((medication, medIndex) => {
                          const medicationName = getMedicationName(medication);
                          return (
                            <button
                              key={medication.id || medication.medicationId || `${medicationName}-${medIndex}`}
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault();
                                updateLine(index, (current) => ({
                                  ...current,
                                  medicationId: medication.id || medication.medicationId || '',
                                  medicationName,
                                }));
                                setMedicationQueryByIndex((prev) => ({ ...prev, [index]: medicationName }));
                                setShowSuggestionsByIndex((prev) => ({ ...prev, [index]: false }));
                              }}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                border: 'none',
                                background: '#fff',
                                padding: '8px 10px',
                                cursor: 'pointer',
                              }}
                            >
                              {medicationName}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </td>

                  <td style={{ padding: 10, verticalAlign: 'top' }}>
                    <input
                      type="number"
                      value={line.dose?.mgPorKg}
                      onChange={(event) =>
                        updateLine(index, (current) => ({
                          ...current,
                          dose: {
                            ...normalizeDose(current.dose),
                            mgPorKg: event.target.value,
                          },
                        }))
                      }
                      placeholder="mg/kg"
                      style={{ width: '100%' }}
                    />
                  </td>

                  <td style={{ padding: 10, verticalAlign: 'top' }}>
                    <input
                      type="number"
                      value={line.dose?.dosisMaxima}
                      onChange={(event) =>
                        updateLine(index, (current) => ({
                          ...current,
                          dose: {
                            ...normalizeDose(current.dose),
                            dosisMaxima: event.target.value,
                          },
                        }))
                      }
                      placeholder="Dosis máxima"
                      style={{ width: '100%' }}
                    />
                  </td>

                  <td style={{ padding: 10, verticalAlign: 'top', position: 'relative' }}>
                    <input
                      type="text"
                      value={line.dose?.frecuencia}
                      onClick={() => setShowFrequencySuggestionsByIndex((prev) => ({ ...prev, [index]: true }))}
                      onBlur={() => {
                        setTimeout(() => {
                          setShowFrequencySuggestionsByIndex((prev) => ({ ...prev, [index]: false }));
                        }, 120);
                      }}
                      onChange={(event) =>
                        updateLine(index, (current) => ({
                          ...current,
                          dose: {
                            ...normalizeDose(current.dose),
                            frecuencia: event.target.value,
                          },
                        }))
                      }
                      placeholder="Frecuencia"
                      style={{ width: '100%' }}
                    />

                    {showFrequencySuggestions && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 42,
                          left: 10,
                          right: 10,
                          zIndex: 10,
                          border: '1px solid #cbd5e1',
                          borderRadius: 6,
                          background: '#fff',
                        }}
                      >
                        {FREQUENCY_SUGGESTIONS.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              updateLine(index, (current) => ({
                                ...current,
                                dose: {
                                  ...normalizeDose(current.dose),
                                  frecuencia: suggestion,
                                },
                              }));
                              setShowFrequencySuggestionsByIndex((prev) => ({ ...prev, [index]: false }));
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              border: 'none',
                              background: '#fff',
                              padding: '8px 10px',
                              cursor: 'pointer',
                            }}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>

                  <td style={{ padding: 10, verticalAlign: 'top' }}>
                    <input
                      type="text"
                      value={line.dose?.unit}
                      onChange={(event) =>
                        updateLine(index, (current) => ({
                          ...current,
                          dose: {
                            ...normalizeDose(current.dose),
                            unit: event.target.value,
                          },
                        }))
                      }
                      placeholder="Unidad"
                      style={{ width: '100%' }}
                    />
                  </td>

                  <td style={{ padding: 10, verticalAlign: 'top' }}>
                    <input
                      type="text"
                      value={line.notes || ''}
                      onChange={(event) =>
                        updateLine(index, {
                          notes: event.target.value,
                        })
                      }
                      placeholder="Notas"
                      style={{ width: '100%' }}
                    />
                  </td>

                  <td style={{ padding: 10, verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                    <button type="button" onClick={() => moveLine(index, -1)} disabled={index === 0}>
                      ↑
                    </button>{' '}
                    <button
                      type="button"
                      onClick={() => moveLine(index, 1)}
                      disabled={index === normalizedLines.length - 1}
                    >
                      ↓
                    </button>{' '}
                    <button type="button" onClick={() => removeLine(index)}>
                      ✕
                    </button>
                  </td>
                </tr>

                {hasDosePreview && (
                  <tr>
                    <td colSpan={8} style={{ padding: '0 10px 10px', color: '#6b7280', fontSize: 13 }}>
                      Dosis estimada para 10kg: {(numericMgPorKg * 10).toLocaleString()} {line.dose?.unit || 'mg'}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      <div style={{ padding: 10, borderTop: '1px solid #e5e7eb' }}>
        <button type="button" onClick={addLine}>
          + Agregar fármaco
        </button>
      </div>
    </section>
  );
};

export default TreatmentLineEditor;
