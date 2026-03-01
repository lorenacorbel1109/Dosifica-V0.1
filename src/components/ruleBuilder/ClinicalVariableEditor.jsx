
const VARIABLE_TYPES = ['number', 'string', 'select', 'multiselect'];

const PATH_OPTIONS = [
  { value: 'edad', label: 'edad → "edad"' },
  { value: 'peso', label: 'peso → "peso"' },
  { value: 'talla', label: 'talla → "talla"' },
  { value: 'sexo', label: 'sexo → "sexo"' },
  { value: 'laboratorio.hemoglobina', label: 'hemoglobina → "laboratorio.hemoglobina"' },
  { value: 'laboratorio.sodio', label: 'sodio → "laboratorio.sodio"' },
  { value: 'laboratorio.glucosa', label: 'glucosa → "laboratorio.glucosa"' },
  { value: 'signos_vitales.temperatura', label: 'temperatura → "signos_vitales.temperatura"' },
  {
    value: 'signos_vitales.frecuencia_respiratoria',
    label: 'frecuencia_respiratoria → "signos_vitales.frecuencia_respiratoria"',
  },
  {
    value: 'signos_vitales.saturacion_oxigeno',
    label: 'saturacion_oxigeno → "signos_vitales.saturacion_oxigeno"',
  },
  {
    value: 'signos_vitales.frecuencia_cardiaca',
    label: 'frecuencia_cardiaca → "signos_vitales.frecuencia_cardiaca"',
  },
  { value: 'signos', label: 'signos → "signos"' },
];

const PATH_VALUES = PATH_OPTIONS.map((option) => option.value);

const createEmptyVariable = () => ({
  key: '',
  label: '',
  type: 'number',
  path: '',
  options: [],
});

const sanitizeKey = (rawValue) => rawValue.replace(/\s+/g, '');

const toOptionsArray = (rawValue) =>
  rawValue
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const getOptionsInputValue = (options) => (Array.isArray(options) ? options.join(', ') : '');

const ClinicalVariableEditor = ({ variables, onChange }) => {
  const safeVariables = Array.isArray(variables) ? variables : [];

  const updateVariables = (nextVariables) => {
    onChange(nextVariables);
  };

  const updateVariable = (index, nextPartial) => {
    const nextVariables = safeVariables.map((variable, rowIndex) =>
      rowIndex === index ? { ...variable, ...nextPartial } : variable,
    );
    updateVariables(nextVariables);
  };

  const removeVariable = (index) => {
    const nextVariables = safeVariables.filter((_, rowIndex) => rowIndex !== index);
    updateVariables(nextVariables);
  };

  const addVariable = () => {
    updateVariables([...safeVariables, createEmptyVariable()]);
  };

  return (
    <section style={{ border: '1px solid #d6dae1', borderRadius: 8, overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            <th style={{ textAlign: 'left', padding: 10 }}>Nombre clave</th>
            <th style={{ textAlign: 'left', padding: 10 }}>Etiqueta visible</th>
            <th style={{ textAlign: 'left', padding: 10 }}>Tipo</th>
            <th style={{ textAlign: 'left', padding: 10 }}>Ruta en datos</th>
            <th style={{ textAlign: 'left', padding: 10 }}>Opciones</th>
            <th style={{ textAlign: 'left', padding: 10 }}>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {safeVariables.map((variable, index) => {
            const type = variable?.type || 'number';
            const showOptions = type === 'select' || type === 'multiselect';
            const isCustomPath = variable?.path && !PATH_VALUES.includes(variable.path);
            const pathMode = isCustomPath ? 'personalizado' : variable?.path || '';

            return (
              <tr key={`${variable?.key || 'variable'}-${index}`} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: 10, verticalAlign: 'top' }}>
                  <input
                    type="text"
                    value={variable?.key || ''}
                    onChange={(event) => {
                      const nextKey = sanitizeKey(event.target.value);
                      const nextLabel = variable?.label?.trim() ? variable.label : nextKey;
                      updateVariable(index, { key: nextKey, label: nextLabel });
                    }}
                    placeholder="ej: hemoglobina"
                    style={{ width: '100%' }}
                  />
                </td>

                <td style={{ padding: 10, verticalAlign: 'top' }}>
                  <input
                    type="text"
                    value={variable?.label || ''}
                    onChange={(event) => updateVariable(index, { label: event.target.value })}
                    placeholder="ej: Hemoglobina (g/dL)"
                    style={{ width: '100%' }}
                  />
                </td>

                <td style={{ padding: 10, verticalAlign: 'top' }}>
                  <select
                    value={type}
                    onChange={(event) => {
                      const nextType = event.target.value;
                      const nextState = { type: nextType };
                      if (nextType !== 'select' && nextType !== 'multiselect') {
                        nextState.options = [];
                      }
                      updateVariable(index, nextState);
                    }}
                    style={{ width: '100%' }}
                  >
                    {VARIABLE_TYPES.map((variableType) => (
                      <option key={variableType} value={variableType}>
                        {variableType}
                      </option>
                    ))}
                  </select>
                </td>

                <td style={{ padding: 10, verticalAlign: 'top' }}>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <select
                      value={pathMode}
                      onChange={(event) => {
                        const selected = event.target.value;
                        if (selected === 'personalizado') {
                          updateVariable(index, { path: isCustomPath ? variable.path : '' });
                          return;
                        }
                        updateVariable(index, { path: selected });
                      }}
                      style={{ width: '100%' }}
                    >
                      <option value="">Seleccionar ruta</option>
                      {PATH_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                      <option value="personalizado">personalizado</option>
                    </select>

                    {pathMode === 'personalizado' && (
                      <input
                        type="text"
                        value={isCustomPath ? variable?.path || '' : ''}
                        onChange={(event) => updateVariable(index, { path: event.target.value })}
                        placeholder="Ruta personalizada"
                        style={{ width: '100%' }}
                      />
                    )}
                  </div>
                </td>

                <td style={{ padding: 10, verticalAlign: 'top' }}>
                  {showOptions ? (
                    <input
                      type="text"
                      value={getOptionsInputValue(variable?.options)}
                      onChange={(event) => updateVariable(index, { options: toOptionsArray(event.target.value) })}
                      placeholder="ej: M, F"
                      style={{ width: '100%' }}
                    />
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: 13 }}>—</span>
                  )}
                </td>

                <td style={{ padding: 10, verticalAlign: 'top' }}>
                  <button
                    type="button"
                    onClick={() => removeVariable(index)}
                    aria-label="Eliminar variable"
                    title="Eliminar variable"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ padding: 10, borderTop: '1px solid #e5e7eb' }}>
        <button type="button" onClick={addVariable}>
          + Agregar variable
        </button>
      </div>
    </section>
  );
};

export default ClinicalVariableEditor;
