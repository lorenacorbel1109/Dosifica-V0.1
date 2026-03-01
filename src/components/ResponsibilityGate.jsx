import React, { useState } from 'react';

/**
 * Compuerta de responsabilidad clínica.
 * Bloquea la visualización de tratamiento definitivo hasta aceptación explícita.
 */
const ResponsibilityGate = ({ onConfirm }) => {
  const [simulateMode, setSimulateMode] = useState(false);

  return (
    <section
      style={{
        border: '1px solid #d32f2f',
        background: '#fff3f3',
        borderRadius: 8,
        padding: 12,
        display: 'grid',
        gap: 8,
      }}
    >
      <h3 style={{ margin: 0 }}>Advertencia de responsabilidad clínica</h3>
      <p style={{ margin: 0 }}>
        Este sistema es herramienta de apoyo. La decisión final corresponde al profesional.
      </p>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="checkbox"
          checked={simulateMode}
          onChange={(e) => setSimulateMode(e.target.checked)}
        />
        Modo simulación (sin registro obligatorio de aceptación)
      </label>

      <div>
        <button type="button" onClick={() => onConfirm({ simulateMode })}>
          Confirmar y mostrar plan terapéutico
        </button>
      </div>
    </section>
  );
};

export default ResponsibilityGate;
