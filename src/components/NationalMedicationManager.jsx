import React, { useMemo, useState } from 'react';
import Card from './Card.jsx';
import { useNationalMedicationsStore } from '../store/nationalMedicationsStore.jsx';

const initialForm = {
  id: '',
  genericName: '',
  atcCode: '',
  concentration: '',
  pharmaceuticalForm: '',
  route: 'VO',
  presentation: '',
  minsaCategory: '',
  indications: '',
};

const NationalMedicationManager = () => {
  const {
    tableName,
    nationalMedications,
    upsertMedication,
    deactivateMedication,
    activateMedication,
    importFromCsv,
    exportAsJson,
  } = useNationalMedicationsStore();

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState('');
  const [message, setMessage] = useState('');

  const sortedRows = useMemo(
    () => [...nationalMedications].sort((a, b) => a.genericName.localeCompare(b.genericName, 'es')),
    [nationalMedications],
  );

  const reset = () => {
    setForm(initialForm);
    setEditingId('');
  };

  const save = () => {
    const ok = upsertMedication({
      ...form,
      id: form.id.trim(),
      genericName: form.genericName.trim(),
      atcCode: form.atcCode.trim(),
      concentration: form.concentration.trim(),
      pharmaceuticalForm: form.pharmaceuticalForm.trim(),
      route: form.route.trim(),
      presentation: form.presentation.trim(),
      minsaCategory: form.minsaCategory.trim(),
      indications: form.indications.split(',').map((item) => item.trim()).filter(Boolean),
      active: true,
      source: editingId ? 'manual' : 'manual',
    });

    if (!ok) {
      setMessage('No se pudo guardar. Verifica ID y nombre genérico.');
      return;
    }

    setMessage(editingId ? 'Medicamento nacional actualizado.' : 'Medicamento nacional agregado.');
    reset();
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      id: item.id,
      genericName: item.genericName,
      atcCode: item.atcCode || '',
      concentration: item.concentration || '',
      pharmaceuticalForm: item.pharmaceuticalForm || '',
      route: item.route || 'VO',
      presentation: item.presentation || '',
      minsaCategory: item.minsaCategory || '',
      indications: (item.indications || []).join(', '),
    });
  };

  const onCsvImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const imported = importFromCsv(text);
    setMessage(imported ? `CSV importado (${imported} registros).` : 'CSV sin registros válidos.');
    event.target.value = '';
  };

  const downloadJson = () => {
    const blob = new Blob([exportAsJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'national-medications.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card title="Petitorio Nacional (national_medications)">
      <div style={{ fontSize: 12, marginBottom: 8 }}>
        Tabla lógica: <strong>{tableName}</strong>. Los registros base no se eliminan, solo se desactivan.
      </div>

      {message && (
        <div style={{ fontSize: 12, background: '#ecfeff', borderRadius: 8, padding: 8, marginBottom: 8 }}>
          {message}
        </div>
      )}

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
        <label>ID<input value={form.id} disabled={Boolean(editingId)} onChange={(e) => setForm((p) => ({ ...p, id: e.target.value }))} /></label>
        <label>Nombre genérico<input value={form.genericName} onChange={(e) => setForm((p) => ({ ...p, genericName: e.target.value }))} /></label>
        <label>Código ATC<input value={form.atcCode} onChange={(e) => setForm((p) => ({ ...p, atcCode: e.target.value }))} /></label>
        <label>Concentración<input value={form.concentration} onChange={(e) => setForm((p) => ({ ...p, concentration: e.target.value }))} /></label>
        <label>Forma farmacéutica<input value={form.pharmaceuticalForm} onChange={(e) => setForm((p) => ({ ...p, pharmaceuticalForm: e.target.value }))} /></label>
        <label>Vía<select value={form.route} onChange={(e) => setForm((p) => ({ ...p, route: e.target.value }))}><option>VO</option><option>IM</option><option>IV</option><option>SC</option><option>Top</option></select></label>
        <label>Presentación<input value={form.presentation} onChange={(e) => setForm((p) => ({ ...p, presentation: e.target.value }))} /></label>
        <label>Categoría MINSA<input value={form.minsaCategory} onChange={(e) => setForm((p) => ({ ...p, minsaCategory: e.target.value }))} /></label>
        <label style={{ gridColumn: '1 / -1' }}>Indicaciones (separadas por coma)
          <input value={form.indications} onChange={(e) => setForm((p) => ({ ...p, indications: e.target.value }))} />
        </label>
      </section>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        <button type="button" onClick={save}>{editingId ? 'Actualizar' : 'Guardar'}</button>
        {editingId && <button type="button" onClick={reset}>Cancelar</button>}
        <button type="button" onClick={downloadJson}>Exportar JSON</button>
        <label style={{ fontSize: 12 }}>
          Importar CSV
          <input type="file" accept=".csv,text/csv" onChange={onCsvImport} />
        </label>
      </div>

      <section style={{ marginTop: 12 }}>
        <h4 style={{ margin: 0 }}>Listado ({sortedRows.length})</h4>
        <div style={{ maxHeight: 320, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th align="left">ID</th><th align="left">Genérico</th><th align="left">Forma</th><th align="left">Ruta</th><th align="left">Estado</th><th align="left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((item) => (
                <tr key={item.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                  <td>{item.id}</td>
                  <td>{item.genericName}<div style={{ color: '#64748b' }}>{item.concentration}</div></td>
                  <td>{item.pharmaceuticalForm}</td>
                  <td>{item.route}</td>
                  <td>{item.active ? 'Activo' : 'Inactivo'}</td>
                  <td>
                    <button type="button" onClick={() => startEdit(item)} style={{ fontSize: 11 }}>Editar</button>{' '}
                    {item.active
                      ? <button type="button" onClick={() => deactivateMedication(item.id)} style={{ fontSize: 11 }}>Desactivar</button>
                      : <button type="button" onClick={() => activateMedication(item.id)} style={{ fontSize: 11 }}>Activar</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </Card>
  );
};

export default NationalMedicationManager;
