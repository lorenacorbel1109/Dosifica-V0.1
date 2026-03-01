import React, { useMemo, useState } from 'react';
import Card from './Card.jsx';
import { useVariablesStore } from '../store/variablesStore.jsx';

const createInitial = () => ({ id: '', name: '', type: 'number', unit: '', options: '' });

/**
 * Módulo de gestión de variables clínicas.
 * Permite: crear, editar, eliminar, listar y exportar catálogo.
 */
const ClinicalVariableManager = () => {
  const { variables, addVariable, updateVariable, removeVariable, exportVariablesJson } = useVariablesStore();
  const [form, setForm] = useState(createInitial());
  const [editingId, setEditingId] = useState('');
  const [message, setMessage] = useState('');

  const orderedVariables = useMemo(
    () => [...variables].sort((left, right) => left.name.localeCompare(right.name, 'es')),
    [variables],
  );

  const resetForm = () => {
    setForm(createInitial());
    setEditingId('');
  };

  const submit = () => {
    const payload = {
      id: form.id.trim(),
      name: form.name.trim(),
      type: form.type,
      unit: form.unit.trim(),
      options: form.type === 'select'
        ? form.options.split(',').map((item) => item.trim()).filter(Boolean)
        : [],
    };

    if (!payload.id || !payload.name) {
      setMessage('ID y nombre son obligatorios.');
      return;
    }

    if (editingId) {
      updateVariable(editingId, payload);
      setMessage('Variable clínica actualizada.');
      resetForm();
      return;
    }

    const ok = addVariable(payload);
    if (!ok) {
      setMessage('No se pudo crear variable (verifica ID único).');
      return;
    }

    setMessage('Variable clínica guardada.');
    resetForm();
  };

  const startEdit = (variable) => {
    setEditingId(variable.id);
    setForm({
      id: variable.id,
      name: variable.name,
      type: variable.type,
      unit: variable.unit || '',
      options: Array.isArray(variable.options) ? variable.options.join(', ') : '',
    });
    setMessage('Editando variable seleccionada.');
  };

  const exportCatalog = () => {
    const payload = exportVariablesJson();
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'clinical-variables.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card title="ClinicalVariableManager">
      {message && (
        <div style={{ fontSize: 12, padding: 8, borderRadius: 8, background: '#f1f5f9', marginBottom: 8 }}>
          {message}
        </div>
      )}

      <section style={{ display: 'grid', gap: 8 }}>
        <label>ID<input value={form.id} disabled={Boolean(editingId)} onChange={(e) => setForm((prev) => ({ ...prev, id: e.target.value }))} /></label>
        <label>Nombre<input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} /></label>
        <label>Tipo
          <select value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}>
            <option value="number">number</option>
            <option value="boolean">boolean</option>
            <option value="select">select</option>
          </select>
        </label>
        <label>Unidad<input value={form.unit} onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))} /></label>
        {form.type === 'select' && (
          <label>Opciones (coma separadas)
            <input value={form.options} onChange={(e) => setForm((prev) => ({ ...prev, options: e.target.value }))} />
          </label>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={submit}>{editingId ? 'Actualizar variable' : 'Guardar variable'}</button>
          {editingId && <button type="button" onClick={resetForm}>Cancelar edición</button>}
          <button type="button" onClick={exportCatalog}>Exportar catálogo JSON</button>
        </div>
      </section>

      <section style={{ marginTop: 12 }}>
        <h4 style={{ margin: 0 }}>Catálogo ({orderedVariables.length})</h4>
        <ul style={{ paddingLeft: 18 }}>
          {orderedVariables.map((item) => (
            <li key={item.id}>
              <strong>{item.name}</strong> ({item.id}) - {item.type}
              {item.unit ? ` [${item.unit}]` : ''}
              {item.type === 'select' && Array.isArray(item.options) && item.options.length
                ? ` | opciones: ${item.options.join(', ')}`
                : ''}{' '}
              <button type="button" onClick={() => startEdit(item)} style={{ fontSize: 11 }}>Editar</button>{' '}
              <button type="button" onClick={() => removeVariable(item.id)} style={{ fontSize: 11 }}>Eliminar</button>
            </li>
          ))}
        </ul>
      </section>
    </Card>
  );
};

export default ClinicalVariableManager;
