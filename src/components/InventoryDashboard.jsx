import React, { useMemo, useState } from 'react';
import SmartTable from './SmartTable.jsx';
import AutoCompleteInput from './AutoCompleteInput.jsx';
import { useEstablishmentsStore } from '../store/establishmentsStore.jsx';

const ROUTE_CHIP_COLORS = {
  VO: { background: '#dbeafe', color: '#1d4ed8' },
  IV: { background: '#fee2e2', color: '#b91c1c' },
  IM: { background: '#ede9fe', color: '#6d28d9' },
};

const InventoryDashboard = () => {
  const { inventoryForActiveEstablishment } = useEstablishmentsStore();
  const [searchText, setSearchText] = useState('');
  const [routeFilter, setRouteFilter] = useState('all');
  const [formFilter, setFormFilter] = useState('all');
  const [lowStockThreshold, setLowStockThreshold] = useState(5);

  const normalizedRows = useMemo(
    () => inventoryForActiveEstablishment.map((item) => ({ ...item, medicationName: item.medicationName || '' })),
    [inventoryForActiveEstablishment],
  );

  const routeOptions = useMemo(
    () => ['all', ...Array.from(new Set(normalizedRows.map((item) => item.route).filter(Boolean)))],
    [normalizedRows],
  );

  const formOptions = useMemo(
    () => ['all', ...Array.from(new Set(normalizedRows.map((item) => item.pharmaceuticalForm).filter(Boolean)))],
    [normalizedRows],
  );

  const medicationSuggestions = useMemo(
    () => Array.from(new Set(normalizedRows.map((item) => item.medicationName).filter(Boolean))),
    [normalizedRows],
  );

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return normalizedRows.filter((item) => {
      if (routeFilter !== 'all' && item.route !== routeFilter) return false;
      if (formFilter !== 'all' && item.pharmaceuticalForm !== formFilter) return false;
      if (!normalizedSearch) return true;
      return String(item.medicationName || '').toLowerCase().includes(normalizedSearch);
    });
  }, [normalizedRows, routeFilter, formFilter, searchText]);

  const summary = useMemo(() => {
    const total = filteredRows.length;
    const available = filteredRows.filter((item) => item.isAvailable && Number(item.stock) > 0).length;
    const noStock = filteredRows.filter((item) => Number(item.stock) <= 0).length;
    return { total, available, noStock };
  }, [filteredRows]);

  const exportInventory = () => {
    const header = ['medicationName', 'route', 'pharmaceuticalForm', 'stock', 'isAvailable', 'expirationDate', 'lastUpdated'];
    const lines = [header.join(',')];

    filteredRows.forEach((row) => {
      const values = [
        row.medicationName,
        row.route,
        row.pharmaceuticalForm,
        row.stock,
        row.isAvailable,
        row.expirationDate,
        row.lastUpdated,
      ].map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`);
      lines.push(values.join(','));
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'establishment-inventory.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const columns = useMemo(
    () => [
      { key: 'medicationName', label: 'Medicamento' },
      {
        key: 'route',
        label: 'Vía',
        render: (value) => {
          const key = String(value || '').toUpperCase();
          const color = ROUTE_CHIP_COLORS[key] || { background: '#e2e8f0', color: '#334155' };
          return (
            <span
              style={{
                background: color.background,
                color: color.color,
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
              }}
            >
              {key || '-'}
            </span>
          );
        },
      },
      { key: 'pharmaceuticalForm', label: 'Forma farmacéutica' },
      {
        key: 'stock',
        label: 'Stock',
        render: (value) => {
          const stock = Number(value || 0);
          if (stock === 0) {
            return <span style={{ color: '#b91c1c', fontWeight: 700 }}>0 ● Sin stock</span>;
          }
          if (stock < Number(lowStockThreshold || 0)) {
            return <span style={{ color: '#a16207', fontWeight: 700 }}>{stock} ● Stock bajo</span>;
          }
          return <span style={{ color: '#15803d', fontWeight: 700 }}>{stock} ● Disponible</span>;
        },
      },
      {
        key: 'isAvailable',
        label: 'Disponibilidad',
        render: (value, row) => {
          const status = value && Number(row.stock) > 0;
          return (
            <span
              style={{
                fontWeight: 700,
                color: status ? '#15803d' : '#b91c1c',
              }}
            >
              {status ? 'Disponible' : 'No disponible'}
            </span>
          );
        },
      },
      { key: 'expirationDate', label: 'Vencimiento' },
    ],
    [lowStockThreshold],
  );

  return (
    <section style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <h4 style={{ margin: 0 }}>InventoryDashboard</h4>
        <button type="button" onClick={exportInventory} style={{ fontSize: 12 }}>
          Exportar inventario
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8, padding: '4px 8px', fontSize: 12 }}>
          Total medicamentos: <strong>{summary.total}</strong>
        </div>
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 8, padding: '4px 8px', fontSize: 12 }}>
          Disponibles: <strong>{summary.available}</strong>
        </div>
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '4px 8px', fontSize: 12 }}>
          Sin stock: <strong>{summary.noStock}</strong>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <AutoCompleteInput
          listId="inventory-search"
          value={searchText}
          onChange={setSearchText}
          suggestions={medicationSuggestions}
          placeholder="Buscar medicamento"
        />

        <select value={routeFilter} onChange={(e) => setRouteFilter(e.target.value)}>
          {routeOptions.map((option) => (
            <option key={option} value={option}>{option === 'all' ? 'Todas las vías' : option}</option>
          ))}
        </select>

        <select value={formFilter} onChange={(e) => setFormFilter(e.target.value)}>
          {formOptions.map((option) => (
            <option key={option} value={option}>{option === 'all' ? 'Todas las formas' : option}</option>
          ))}
        </select>

        <label style={{ fontSize: 12 }}>
          Umbral stock bajo
          <input
            type="number"
            min="1"
            value={lowStockThreshold}
            onChange={(event) => setLowStockThreshold(Number(event.target.value || 1))}
            style={{ width: 80, marginLeft: 6 }}
          />
        </label>
      </div>

      <SmartTable
        columns={columns}
        rows={filteredRows}
        filterText=""
        pageSize={12}
        maxHeight={300}
        compact
        emptyMessage="No hay registros de inventario para los filtros seleccionados."
      />
    </section>
  );
};

export default InventoryDashboard;
