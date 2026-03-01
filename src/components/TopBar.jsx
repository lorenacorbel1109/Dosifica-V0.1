import SearchBar from './SearchBar.jsx';

/**
 * Barra superior con estado y acciones rápidas del workspace.
 */
const TopBar = ({
  mode,
  activeEstablishment,
  activeNtsVersion,
  compactMode,
  onToggleCompact,
  onToggleSidebar,
  searchTerm,
  onSearchChange,
  isMobile,
}) => {
  if (isMobile) {
    return (
      <header
        style={{
          height: 'var(--topbar-height)',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          alignItems: 'center',
          gap: 8,
          padding: '0 var(--space-3)',
        }}
      >
        <strong style={{ color: 'var(--color-primary)' }}>Dosifica</strong>
        <span
          title={activeEstablishment?.name || '-'}
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'center',
            fontSize: 13,
            color: 'var(--color-text-secondary)',
          }}
        >
          {activeEstablishment?.name || 'Sin establecimiento'}
        </span>
        <strong style={{ fontSize: 12 }}>{mode}</strong>
      </header>
    );
  }

  return (
    <header
      style={{
        height: 'var(--topbar-height)',
        display: 'grid',
        gap: 6,
        alignContent: 'center',
        padding: '6px var(--space-4)',
      }}
    >
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13 }}>
          <strong>Modo: {mode}</strong>
          <span>Versión activa: {activeNtsVersion}</span>
          <span>
            Establecimiento: {activeEstablishment?.name || '-'} ({activeEstablishment?.level || '-'})
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={onToggleSidebar} style={{ fontSize: 12 }}>
            Mostrar/Ocultar menú
          </button>
          <button type="button" onClick={onToggleCompact} style={{ fontSize: 12 }}>
            {compactMode ? 'Vista normal' : 'Modo compacto'}
          </button>
        </div>
      </div>

      <SearchBar
        value={searchTerm}
        onChange={onSearchChange}
        placeholder="Buscar regla, patología, diagnóstico o severidad..."
      />
    </header>
  );
};

export default TopBar;
