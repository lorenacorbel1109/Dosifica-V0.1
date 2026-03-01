import { useEffect, useMemo, useState } from 'react';
import { useEstablishmentsStore } from '../store/establishmentsStore.jsx';

/**
 * Selector de establecimiento activo y alta rápida de sedes.
 */
const EstablishmentSelector = () => {
  const {
    establishments,
    activeEstablishmentId,
    setActiveEstablishment,
    addEstablishment,
  } = useEstablishmentsStore();

  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newLevel, setNewLevel] = useState('I-1');
  const [pulse, setPulse] = useState(false);

  const activeName = useMemo(
    () => establishments.find((item) => item.id === activeEstablishmentId)?.name || '-',
    [establishments, activeEstablishmentId],
  );

  useEffect(() => {
    setPulse(true);
    const timer = setTimeout(() => setPulse(false), 300);
    return () => clearTimeout(timer);
  }, [activeEstablishmentId]);

  return (
    <section
      style={{
        border: '1px solid #ddd',
        borderRadius: 8,
        padding: 12,
        display: 'grid',
        gap: 8,
        transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
        transform: pulse ? 'translateY(-1px)' : 'translateY(0)',
        borderColor: pulse ? '#93c5fd' : '#ddd',
        boxShadow: pulse ? '0 0 0 2px rgba(147,197,253,0.2)' : 'none',
      }}
    >
      <h2 style={{ marginBottom: 0 }}>Establecimiento activo</h2>
      <div style={{ fontSize: 12, color: '#4b5563' }}>Actual: {activeName}</div>

      <label>
        Seleccionar establecimiento
        <select value={activeEstablishmentId} onChange={(e) => setActiveEstablishment(e.target.value)}>
          {establishments.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} ({item.id}) - {item.level}
            </option>
          ))}
        </select>
      </label>

      <details>
        <summary>Agregar nuevo establecimiento</summary>
        <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          <input
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
            placeholder="ID (ej: EST-003)"
          />
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre del establecimiento"
          />
          <select value={newLevel} onChange={(e) => setNewLevel(e.target.value)}>
            <option value="I-1">I-1</option>
            <option value="I-2">I-2</option>
            <option value="I-3">I-3</option>
            <option value="I-4">I-4</option>
          </select>
          <button
            type="button"
            onClick={() => {
              addEstablishment({ id: newId.trim(), name: newName.trim(), level: newLevel });
              if (newId.trim()) {
                setActiveEstablishment(newId.trim());
              }
              setNewId('');
              setNewName('');
              setNewLevel('I-1');
            }}
          >
            Crear establecimiento
          </button>
        </div>
      </details>
    </section>
  );
};

export default EstablishmentSelector;
