
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

const Sidebar = ({ activeSection, onSelectSection, collapsed, onToggleCollapsed, isTablet }) => {
  const compact = collapsed;

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr auto', height: '100%' }}>
      <h2
        style={{
          margin: 0,
          padding: compact ? '12px 8px' : '14px 12px',
          fontSize: compact ? 14 : 16,
          textAlign: compact ? 'center' : 'left',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {compact ? 'D' : 'Dosifica'}
      </h2>

      <nav style={{ padding: '8px 6px', display: 'grid', gap: 4, overflowY: 'auto' }}>
        {NAV_ITEMS.map((item) => {
          const active = activeSection === item.id;

          return (
            <button
              type="button"
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              title={compact ? item.tooltip || item.label : ''}
              className="touch-friendly"
              style={{
                border: 'none',
                borderRadius: 8,
                padding: compact ? '10px 8px' : '10px 12px',
                textAlign: 'left',
                background: active ? 'rgba(26,86,219,0.24)' : 'transparent',
                color: '#e2e8f0',
                display: 'flex',
                justifyContent: compact ? 'center' : 'flex-start',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
              }}
            >
              <span aria-label={item.label}>{item.icon}</span>
              {!compact && <span style={{ fontSize: 13 }}>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {(isTablet || true) && (
        <div style={{ padding: 8, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="touch-friendly"
            style={{
              width: '100%',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8,
              background: 'transparent',
              color: '#e2e8f0',
              cursor: 'pointer',
            }}
          >
            {collapsed ? '»' : '«'} {collapsed ? '' : 'Colapsar'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
