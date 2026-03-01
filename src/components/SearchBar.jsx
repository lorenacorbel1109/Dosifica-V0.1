import React from 'react';

/**
 * Buscador global en tiempo real.
 */
const SearchBar = ({ value, onChange, placeholder = 'Buscar...' }) => {
  return (
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        minWidth: 220,
        border: '1px solid #d1d5db',
        borderRadius: 8,
        padding: '8px 10px',
      }}
    />
  );
};

export default SearchBar;
