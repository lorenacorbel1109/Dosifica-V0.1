import React from 'react';
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
}) => {
  return (
    <header style={{ display: 'grid', gap: 8 }}>
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
