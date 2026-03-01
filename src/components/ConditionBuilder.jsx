import React from 'react';

/**
 * Opciones base para construir condiciones clínicas.
 */
export const FIELD_OPTIONS = [
  { value: 'edad', label: 'Edad' },
  { value: 'peso', label: 'Peso' },
  { value: 'sexo', label: 'Sexo' },
  { value: 'sintomas', label: 'Síntomas' },
  { value: 'signos', label: 'Signos' },
  { value: 'laboratorio.hemoglobina', label: 'Laboratorio: Hemoglobina' },
  { value: 'laboratorio.sodio', label: 'Laboratorio: Sodio' },
  { value: 'nivelResolutivo', label: 'Nivel resolutivo' },
  { value: 'medicamentosDisponibles', label: 'Medicamentos disponibles' },
  { value: 'equiposDisponibles', label: 'Equipos disponibles' },
];

export const OPERATOR_OPTIONS = [
  { value: '>', label: '>' },
  { value: '<', label: '<' },
  { value: '>=', label: '>=' },
  { value: '<=', label: '<=' },
  { value: '=', label: '=' },
  { value: '!=', label: '!=' },
  { value: 'includes', label: 'includes' },
  { value: 'notIncludes', label: 'not includes' },
];

/**
 * Builder dinámico para una lista de condiciones (grupo lógico superior AND/OR).
 */
const ConditionBuilder = ({
  conditions,
  onChange,
  groupOperator = 'AND',
  onGroupOperatorChange,
}) => {
  const updateCondition = (index, key, value) => {
    const next = [...conditions];
    next[index] = { ...next[index], [key]: value };
    onChange(next);
  };

  const addCondition = () => {
    onChange([
      ...conditions,
      {
        field: 'edad',
        operator: '>',
        value: '',
        label: 'Edad',
        type: 'number',
      },
    ]);
  };

  const removeCondition = (index) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  return (
    <section style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
      <h3>Condiciones clínicas</h3>
      <p style={{ marginTop: 0, color: '#555' }}>
        Define condiciones con operador lógico global (AND/OR).
      </p>

      {typeof onGroupOperatorChange === 'function' && (
        <label style={{ display: 'grid', gap: 4, marginBottom: 10 }}>
          Operador lógico del grupo
          <select value={groupOperator} onChange={(event) => onGroupOperatorChange(event.target.value)}>
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          </select>
        </label>
      )}

      {conditions.map((condition, index) => (
        <div
          key={`condition-${index}`}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr auto',
            gap: 8,
            marginBottom: 8,
            alignItems: 'center',
          }}
        >
          <select
            value={condition.field}
            onChange={(e) => {
              const selected = FIELD_OPTIONS.find((option) => option.value === e.target.value);
              updateCondition(index, 'field', e.target.value);
              updateCondition(index, 'label', selected?.label || e.target.value);
            }}
            aria-label={`Campo condición ${index + 1}`}
          >
            {FIELD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={condition.operator}
            onChange={(e) => updateCondition(index, 'operator', e.target.value)}
            aria-label={`Operador condición ${index + 1}`}
          >
            {OPERATOR_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={condition.value}
            onChange={(e) => updateCondition(index, 'value', e.target.value)}
            placeholder="Valor"
            aria-label={`Valor condición ${index + 1}`}
          />

          <button type="button" onClick={() => removeCondition(index)}>
            Eliminar
          </button>
        </div>
      ))}

      <button type="button" onClick={addCondition}>
        + Agregar condición
      </button>
    </section>
  );
};

export default ConditionBuilder;
