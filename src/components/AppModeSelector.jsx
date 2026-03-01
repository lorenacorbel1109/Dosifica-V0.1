import React, { useEffect, useState } from 'react';
import { useAppModeStore } from '../store/appModeStore.jsx';

/**
 * Selector explícito de modo de operación.
 */
const AppModeSelector = () => {
  const { mode, setMode, isSimulation, isProduction } = useAppModeStore();
  const [modePulse, setModePulse] = useState(false);

  useEffect(() => {
    setModePulse(true);
    const timer = setTimeout(() => setModePulse(false), 260);
    return () => clearTimeout(timer);
  }, [mode]);

  return (
    <section
      style={{
        border: '1px solid #ddd',
        borderRadius: 8,
        padding: 12,
        display: 'grid',
        gap: 8,
        transition: 'background-color 180ms ease, border-color 180ms ease',
        background: modePulse ? '#f8fbff' : '#fff',
        borderColor: modePulse ? '#93c5fd' : '#ddd',
      }}
    >
      <h2 style={{ margin: 0 }}>Modo de aplicación</h2>

      <label>
        Seleccionar modo
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="simulation">Simulación</option>
          <option value="production">Producción</option>
        </select>
      </label>

      <div style={{ fontSize: 13, background: '#f7f7f7', borderRadius: 6, padding: 8 }}>
        {isSimulation && (
          <span>
            Simulación activa: no guarda auditoría, no registra decisiones y no exige compuerta legal.
          </span>
        )}
        {isProduction && (
          <span>
            Producción activa: auditoría y decision log habilitados; responsabilidad clínica obligatoria.
          </span>
        )}
      </div>
    </section>
  );
};

export default AppModeSelector;
