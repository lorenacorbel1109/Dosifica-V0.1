import {
  OPERATOR_OPTIONS,
  createEmptyCondition,
  createEmptyGroup,
} from '../../types/ruleBuilderSchema.js';

const isGroup = (item) => item && Array.isArray(item.conditions) && typeof item.operator === 'string';

const getDepthStyles = (depth) => {
  if (depth <= 0) {
    return { marginLeft: 0, borderLeft: '2px solid #d5d7db' };
  }

  if (depth === 1) {
    return { marginLeft: 16, borderLeft: '2px solid #93c5fd' };
  }

  return { marginLeft: 32, borderLeft: '2px solid #c4b5fd' };
};

const ConditionGroupBuilder = ({ group, onChange, clinicalVariables, depth = 0 }) => {
  const safeGroup = group || { operator: 'AND', conditions: [] };
  const items = Array.isArray(safeGroup.conditions) ? safeGroup.conditions : [];

  const depthStyles = getDepthStyles(depth);
  const canAddNestedGroup = depth < 3;

  const handleOperatorChange = (operator) => {
    onChange({
      ...safeGroup,
      operator,
    });
  };

  const updateItem = (index, nextItem) => {
    const nextConditions = items.map((item, itemIndex) => (itemIndex === index ? nextItem : item));
    onChange({ ...safeGroup, conditions: nextConditions });
  };

  const removeItem = (index) => {
    const nextConditions = items.filter((_, itemIndex) => itemIndex !== index);
    onChange({ ...safeGroup, conditions: nextConditions });
  };

  const addCondition = () => {
    onChange({
      ...safeGroup,
      conditions: [...items, createEmptyCondition()],
    });
  };

  const addGroup = () => {
    onChange({
      ...safeGroup,
      conditions: [...items, createEmptyGroup('AND')],
    });
  };

  return (
    <section
      style={{
        ...depthStyles,
        borderRadius: 8,
        padding: 12,
        display: 'grid',
        gap: 10,
        background: '#fff',
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => handleOperatorChange('AND')}
            style={{
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              padding: '6px 10px',
              background: safeGroup.operator === 'AND' ? '#e2e8f0' : '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Y (AND)
          </button>
          <button
            type="button"
            onClick={() => handleOperatorChange('OR')}
            style={{
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              padding: '6px 10px',
              background: safeGroup.operator === 'OR' ? '#e2e8f0' : '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            O (OR)
          </button>
        </div>

        {depth > 0 && (
          <button
            type="button"
            onClick={() => onChange(null)}
            style={{
              border: '1px solid #fecaca',
              borderRadius: 6,
              padding: '6px 10px',
              background: '#fff1f2',
              color: '#9f1239',
              cursor: 'pointer',
            }}
          >
            Eliminar grupo
          </button>
        )}
      </header>

      <div style={{ display: 'grid', gap: 8 }}>
        {items.map((item, index) => {
          if (isGroup(item)) {
            return (
              <ConditionGroupBuilder
                key={item.id || `group-${depth}-${index}`}
                group={item}
                clinicalVariables={clinicalVariables}
                depth={depth + 1}
                onChange={(nextGroup) => {
                  if (!nextGroup) {
                    removeItem(index);
                    return;
                  }
                  updateItem(index, nextGroup);
                }}
              />
            );
          }

          const selectedVariable = (clinicalVariables || []).find((variable) => variable.key === item.field);
          const valueInputType = item.type === 'number' ? 'number' : 'text';

          return (
            <div
              key={item.id || `condition-${depth}-${index}`}
              style={{
                display: 'grid',
                gap: 8,
                gridTemplateColumns: '1.3fr 1fr 1fr auto',
                alignItems: 'center',
              }}
            >
              <select
                value={item.field || ''}
                onChange={(event) => {
                  const nextField = event.target.value;
                  const nextVariable = (clinicalVariables || []).find((variable) => variable.key === nextField);
                  updateItem(index, {
                    ...item,
                    field: nextField,
                    label: nextVariable?.label || '',
                    type: nextVariable?.type === 'number' ? 'number' : 'string',
                    value: '',
                  });
                }}
              >
                <option value="">Seleccionar campo</option>
                {(clinicalVariables || []).map((variable) => (
                  <option key={variable.key} value={variable.key}>
                    {variable.label}
                  </option>
                ))}
              </select>

              <select
                value={item.operator || '>'}
                onChange={(event) =>
                  updateItem(index, {
                    ...item,
                    operator: event.target.value,
                  })
                }
              >
                {OPERATOR_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <input
                type={valueInputType}
                value={item.value ?? ''}
                onChange={(event) =>
                  updateItem(index, {
                    ...item,
                    label: item.label || selectedVariable?.label || '',
                    type: item.type || (selectedVariable?.type === 'number' ? 'number' : 'string'),
                    value: event.target.value,
                  })
                }
                placeholder={valueInputType === 'number' ? 'Valor numérico' : 'Valor'}
              />

              <button
                type="button"
                onClick={() => removeItem(index)}
                style={{
                  border: '1px solid #fecaca',
                  borderRadius: 6,
                  padding: '6px 8px',
                  background: '#fff1f2',
                  color: '#9f1239',
                  cursor: 'pointer',
                }}
                aria-label="Eliminar condición"
                title="Eliminar condición"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      <footer style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={addCondition}
          style={{
            border: '1px solid #cbd5e1',
            borderRadius: 6,
            padding: '6px 10px',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          + Condición
        </button>

        {canAddNestedGroup && (
          <button
            type="button"
            onClick={addGroup}
            style={{
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              padding: '6px 10px',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            + Grupo AND/OR
          </button>
        )}
      </footer>
    </section>
  );
};

export default ConditionGroupBuilder;
