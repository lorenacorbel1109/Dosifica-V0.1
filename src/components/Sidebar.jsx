import React from 'react';
import styles from './MainLayout.module.css';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Estado general', icon: '📊', tooltip: 'Resumen del estado clínico del sistema' },
  { id: 'evaluacion', label: 'Evaluación clínica', icon: '🩺', tooltip: 'Evaluar paciente y generar plan sugerido' },
  { id: 'reglas', label: 'Editor de reglas', icon: '📘', tooltip: 'Crear, editar e importar reglas clínicas' },
  { id: 'variables', label: 'Variables clínicas', icon: '🧪', tooltip: 'Catálogo dinámico de variables clínicas' },
  { id: 'inventario', label: 'Inventario', icon: '💊', tooltip: 'Medicamentos, equipos y nivel resolutivo' },
  { id: 'petitorio', label: 'Petitorio nacional', icon: '📚', tooltip: 'Base normativa nacional de medicamentos (MINSA)' },
  { id: 'auditoria', label: 'Auditoría', icon: '🧾', tooltip: 'Histórico de ejecuciones del motor' },
  { id: 'decisiones', label: 'Decisiones médicas', icon: '👩‍⚕️', tooltip: 'Confirmaciones y ajustes clínicos' },
  { id: 'versionado', label: 'Versionado', icon: '🧬', tooltip: 'Gestión de versiones NTS' },
  { id: 'establecimientos', label: 'Establecimientos', icon: '🏥', tooltip: 'Seleccionar sede activa' },
];

const Sidebar = ({ activeSection, onSelectSection, collapsed }) => {
  if (collapsed) {
    return null;
  }

  return (
    <aside className={styles.sidebar}>
      <h2 style={{ padding: '14px', margin: 0, fontSize: '1rem' }}>Panel clínico</h2>
      <nav>
        {NAV_ITEMS.map((item) => (
          <button
            type="button"
            key={item.id}
            className={`${styles.navItem} ${activeSection === item.id ? styles.navItemActive : ''}`}
            onClick={() => onSelectSection(item.id)}
          >
            <span className={styles.iconWithTooltip} title={item.tooltip} aria-label={item.tooltip}>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
