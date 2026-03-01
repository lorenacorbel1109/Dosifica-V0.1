import React, { useMemo, useState } from 'react';
import { useClinicalStore } from '../store/clinicalStore.jsx';

/**
 * Panel de control de versiones NTS de reglas clínicas.
 */
const VersionControlPanel = () => {
  const {
    activeNtsVersion,
    setActiveNtsVersion,
    versionSummary,
    rules,
    toggleVersionActive,
    cloneVersion,
  } = useClinicalStore();

  const [targetVersion, setTargetVersion] = useState('NTS-2025');

  const versions = useMemo(
    () => Array.from(new Set(versionSummary.map((item) => item.version))),
    [versionSummary],
  );

  const rulesInActiveVersion = useMemo(
    () => rules.filter((rule) => rule.ntsVersion === activeNtsVersion),
    [rules, activeNtsVersion],
  );

  return (
    <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, display: 'grid', gap: 10 }}>
      <h2 style={{ marginBottom: 0 }}>Control de versiones de reglas</h2>

      <label>
        Versión global activa
        <select value={activeNtsVersion} onChange={(e) => setActiveNtsVersion(e.target.value)}>
          {versions.length ? (
            versions.map((version) => (
              <option key={version} value={version}>
                {version}
              </option>
            ))
          ) : (
            <option value={activeNtsVersion}>{activeNtsVersion}</option>
          )}
        </select>
      </label>

      <section style={{ border: '1px solid #eee', borderRadius: 8, padding: 10 }}>
        <h3 style={{ marginTop: 0 }}>Versiones detectadas</h3>
        {!versionSummary.length ? (
          <p style={{ color: '#777' }}>No hay reglas cargadas.</p>
        ) : (
          <ul style={{ marginBottom: 0 }}>
            {versionSummary.map((item) => (
              <li key={item.version} style={{ marginBottom: 6 }}>
                <strong>{item.version}</strong> — total: {item.total}, activas: {item.activeCount}, inactivas:{' '}
                {item.inactiveCount}
                <div style={{ display: 'inline-flex', gap: 6, marginLeft: 8 }}>
                  <button type="button" onClick={() => toggleVersionActive(item.version, true)}>
                    Activar versión
                  </button>
                  <button type="button" onClick={() => toggleVersionActive(item.version, false)}>
                    Desactivar versión
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ border: '1px solid #eee', borderRadius: 8, padding: 10 }}>
        <h3 style={{ marginTop: 0 }}>Clonar reglas a nueva versión</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          <label>
            Desde versión
            <select value={activeNtsVersion} onChange={(e) => setActiveNtsVersion(e.target.value)}>
              {versions.map((version) => (
                <option key={version} value={version}>
                  {version}
                </option>
              ))}
            </select>
          </label>

          <label>
            Nueva versión destino
            <input
              value={targetVersion}
              onChange={(e) => setTargetVersion(e.target.value)}
              placeholder="Ej: NTS-2025"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              if (!targetVersion.trim()) return;
              cloneVersion(activeNtsVersion, targetVersion.trim());
              setActiveNtsVersion(targetVersion.trim());
            }}
          >
            Clonar versión
          </button>
        </div>
      </section>

      <section style={{ border: '1px solid #eee', borderRadius: 8, padding: 10 }}>
        <h3 style={{ marginTop: 0 }}>Reglas en versión activa: {activeNtsVersion}</h3>
        {!rulesInActiveVersion.length ? (
          <p style={{ color: '#777' }}>No hay reglas para esta versión.</p>
        ) : (
          <ul style={{ marginBottom: 0 }}>
            {rulesInActiveVersion.map((rule) => (
              <li key={`${rule.id}-${rule.ntsVersion}`}>
                {rule.id} — {rule.diagnosis} — active: {String(rule.active)} — updatedAt: {rule.updatedAt}
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
};

export default VersionControlPanel;
