import React, { useMemo, useState } from 'react';
import { useEstablishmentsStore } from '../store/establishmentsStore.jsx';
import { useNationalMedicationsStore } from '../store/nationalMedicationsStore.jsx';
import AutoCompleteInput from './AutoCompleteInput.jsx';
import Card from './Card.jsx';
import InventoryDashboard from './InventoryDashboard.jsx';

const KNOWN_EQUIPMENT = ['venoclisis', 'balanza pediátrica', 'oxímetro', 'cama hospitalaria'];
const REQUIRED_CSV_COLUMNS = ['genericname', 'concentration', 'pharmaceuticalform', 'route', 'presentation', 'stock'];

const normalizeText = (value) => String(value ?? '').trim();

const parseCsvRows = (csvText) => {
  const lines = String(csvText || '').split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) {
    return { missingColumns: REQUIRED_CSV_COLUMNS, rows: [] };
  }

  const headers = lines[0].split(',').map((token) => token.trim().toLowerCase());
  const missingColumns = REQUIRED_CSV_COLUMNS.filter((column) => !headers.includes(column));
  if (missingColumns.length) {
    return { missingColumns, rows: [] };
  }

  const rows = lines.slice(1).map((line) => {
    const values = line.split(',').map((token) => token.trim());
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });

  return { missingColumns: [], rows };
};

/**
 * Editor del inventario del establecimiento activo usando establishment_inventory.
 */
const InventoryManager = () => {
  const {
    tableName,
    activeEstablishment,
    updateActiveField,
    inventoryForActiveEstablishment,
    associateNationalMedicationToEstablishment,
    updateInventoryStock,
    setInventoryAvailability,
    addEquipmentToActive,
    removeEquipmentFromActive,
  } = useEstablishmentsStore();

  const { nationalMedications, activeNationalMedications, upsertMedication } = useNationalMedicationsStore();

  const [selectedMedicationName, setSelectedMedicationName] = useState('');
  const [selectedStock, setSelectedStock] = useState('1');
  const [selectedExpirationDate, setSelectedExpirationDate] = useState('');
  const [newEquipment, setNewEquipment] = useState('');
  const [message, setMessage] = useState('');
  const [uploadSummary, setUploadSummary] = useState(null);

  const medicationOptions = useMemo(
    () => Array.from(new Set(activeNationalMedications.map((item) => item.genericName))),
    [activeNationalMedications],
  );

  const equipmentOptions = useMemo(
    () => Array.from(new Set([...KNOWN_EQUIPMENT, ...(activeEstablishment?.equipmentAvailable || [])])),
    [activeEstablishment],
  );

  const selectedMedication = useMemo(
    () => activeNationalMedications.find((item) => item.genericName === selectedMedicationName) || null,
    [activeNationalMedications, selectedMedicationName],
  );

  if (!activeEstablishment) {
    return null;
  }

  const onAssociateMedication = () => {
    if (!selectedMedication) {
      setMessage('Seleccione un medicamento válido del petitorio nacional.');
      return;
    }

    const ok = associateNationalMedicationToEstablishment({
      establishmentId: activeEstablishment.id,
      nationalMedication: selectedMedication,
      stock: Number(selectedStock || 0),
      expirationDate: selectedExpirationDate,
    });

    setMessage(ok ? 'Medicamento asociado al establecimiento.' : 'No se pudo asociar medicamento.');
  };

  const onCsvImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const parsed = parseCsvRows(text);

    if (parsed.missingColumns.length) {
      setUploadSummary({
        totalProcessed: 0,
        matchesFound: 0,
        newCreated: 0,
        errors: parsed.missingColumns.length,
        warnings: [`Faltan columnas requeridas: ${parsed.missingColumns.join(', ')}`],
      });
      setMessage('CSV inválido: faltan columnas requeridas.');
      event.target.value = '';
      return;
    }

    const summary = {
      totalProcessed: 0,
      matchesFound: 0,
      newCreated: 0,
      errors: 0,
      warnings: [],
    };

    const mutableNational = [...nationalMedications];

    parsed.rows.forEach((row, index) => {
      summary.totalProcessed += 1;

      const genericName = normalizeText(row.genericname);
      const concentration = normalizeText(row.concentration);
      const pharmaceuticalForm = normalizeText(row.pharmaceuticalform);
      const route = normalizeText(row.route);
      const presentation = normalizeText(row.presentation);
      const stock = Number(row.stock);

      if (!genericName || !concentration || !pharmaceuticalForm || !route || !presentation || Number.isNaN(stock)) {
        summary.errors += 1;
        summary.warnings.push(`Fila ${index + 2}: datos incompletos o stock inválido.`);
        return;
      }

      let matched = mutableNational.find((item) =>
        normalizeText(item.genericName).toLowerCase() === genericName.toLowerCase()
        && normalizeText(item.concentration).toLowerCase() === concentration.toLowerCase()
        && normalizeText(item.pharmaceuticalForm).toLowerCase() === pharmaceuticalForm.toLowerCase()
        && normalizeText(item.route).toLowerCase() === route.toLowerCase()
        && normalizeText(item.presentation).toLowerCase() === presentation.toLowerCase(),
      );

      if (matched) {
        summary.matchesFound += 1;
      } else {
        const generatedId = `PNM-AUTO-${Date.now()}-${index + 1}`;
        const newNational = {
          id: generatedId,
          genericName,
          concentration,
          pharmaceuticalForm,
          route,
          presentation,
          minsaCategory: 'Pendiente validación',
          indications: [],
          active: true,
        };
        const created = upsertMedication(newNational, 'csv-auto');
        if (!created) {
          summary.errors += 1;
          summary.warnings.push(`Fila ${index + 2}: no se pudo crear medicamento nacional.`);
          return;
        }
        matched = newNational;
        mutableNational.push(newNational);
        summary.newCreated += 1;
        summary.warnings.push(`Fila ${index + 2}: medicamento no encontrado en national_medications, creado automáticamente.`);
      }

      const ok = associateNationalMedicationToEstablishment({
        establishmentId: activeEstablishment.id,
        nationalMedication: matched,
        stock,
        expirationDate: '',
      });

      if (!ok) {
        summary.errors += 1;
        summary.warnings.push(`Fila ${index + 2}: no se pudo insertar/actualizar inventario.`);
      }
    });

    setUploadSummary(summary);
    setMessage(`CSV procesado: ${summary.totalProcessed} filas.`);
    event.target.value = '';
  };

  return (
    <Card title="Inventario del establecimiento">
      <div style={{ fontSize: 12, marginBottom: 8 }}>
        Tabla lógica: <strong>{tableName}</strong>. Inventario local separado del petitorio nacional.
      </div>

      {message && <div style={{ fontSize: 12, color: '#0369a1', marginBottom: 8 }}>{message}</div>}

      {uploadSummary && (
        <div style={{ fontSize: 12, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8, padding: 10 }}>
          <strong>Resumen post-carga CSV</strong>
          <ul style={{ margin: '6px 0 0 18px' }}>
            <li>Total procesados: {uploadSummary.totalProcessed}</li>
            <li>Coincidencias encontradas: {uploadSummary.matchesFound}</li>
            <li>Nuevos creados: {uploadSummary.newCreated}</li>
            <li>Errores: {uploadSummary.errors}</li>
          </ul>
          {uploadSummary.warnings?.length > 0 && (
            <details>
              <summary>Advertencias ({uploadSummary.warnings.length})</summary>
              <ul style={{ margin: '6px 0 0 18px' }}>
                {uploadSummary.warnings.map((warning, index) => <li key={`${warning}-${index}`}>{warning}</li>)}
              </ul>
            </details>
          )}
        </div>
      )}

      <section style={{ display: 'grid', gap: 10 }}>
        <label>
          ID del establecimiento
          <input value={activeEstablishment.id} onChange={(e) => updateActiveField('id', e.target.value)} />
        </label>

        <label>
          Nombre
          <input value={activeEstablishment.name} onChange={(e) => updateActiveField('name', e.target.value)} />
        </label>

        <label>
          Nivel resolutivo
          <select value={activeEstablishment.level} onChange={(e) => updateActiveField('level', e.target.value)}>
            <option value="I-1">I-1</option>
            <option value="I-2">I-2</option>
            <option value="I-3">I-3</option>
            <option value="I-4">I-4</option>
          </select>
        </label>

        <section>
          <h4 style={{ marginBottom: 6 }}>Asociar medicamento nacional</h4>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'end' }}>
            <AutoCompleteInput
              listId="inventory-medications"
              value={selectedMedicationName}
              onChange={setSelectedMedicationName}
              suggestions={medicationOptions}
              placeholder="Medicamento del petitorio"
            />
            <label style={{ fontSize: 12 }}>
              Stock
              <input value={selectedStock} onChange={(e) => setSelectedStock(e.target.value)} style={{ width: 100 }} />
            </label>
            <label style={{ fontSize: 12 }}>
              Vencimiento
              <input type="date" value={selectedExpirationDate} onChange={(e) => setSelectedExpirationDate(e.target.value)} />
            </label>
            <button type="button" onClick={onAssociateMedication} style={{ fontSize: 12 }}>
              Asociar
            </button>
            <label style={{ fontSize: 12 }}>
              Importar CSV inventario
              <input type="file" accept=".csv,text/csv" onChange={onCsvImport} />
            </label>
          </div>

          <ul style={{ paddingLeft: 18 }}>
            {inventoryForActiveEstablishment.map((item) => (
              <li key={item.id} style={{ marginBottom: 6 }}>
                <strong>{item.medicationName}</strong> ({item.nationalMedicationId}) — Stock: {item.stock}{' '}
                {item.stock === 0 && <span style={{ color: '#b91c1c', fontWeight: 700 }}>⚠ Sin stock</span>}{' '}
                <button
                  type="button"
                  onClick={() => updateInventoryStock(item.id, Number(item.stock || 0) + 1)}
                  style={{ fontSize: 11 }}
                >
                  +1
                </button>{' '}
                <button
                  type="button"
                  onClick={() => updateInventoryStock(item.id, Math.max(0, Number(item.stock || 0) - 1))}
                  style={{ fontSize: 11 }}
                >
                  -1
                </button>{' '}
                <button
                  type="button"
                  onClick={() => setInventoryAvailability(item.id, !item.isAvailable)}
                  style={{ fontSize: 11 }}
                >
                  {item.isAvailable ? 'Marcar no disponible' : 'Marcar disponible'}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h4 style={{ marginBottom: 6 }}>Equipamiento disponible</h4>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <AutoCompleteInput
              listId="inventory-equipment"
              value={newEquipment}
              onChange={setNewEquipment}
              suggestions={equipmentOptions}
              placeholder="Equipo"
            />
            <button
              type="button"
              onClick={() => {
                addEquipmentToActive(newEquipment);
                setNewEquipment('');
              }}
              style={{ fontSize: 12 }}
            >
              Agregar
            </button>
          </div>

          <ul>
            {activeEstablishment.equipmentAvailable.map((item) => (
              <li key={item}>
                {item}{' '}
                <button type="button" onClick={() => removeEquipmentFromActive(item)} style={{ fontSize: 12 }}>
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        </section>

        <InventoryDashboard />
      </section>
    </Card>
  );
};

export default InventoryManager;
