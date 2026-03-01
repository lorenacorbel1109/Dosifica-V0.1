import React, { useMemo } from 'react';

/**
 * Input con sugerencias rápidas para texto clínico frecuente.
 */
const AutoCompleteInput = ({
  value,
  onChange,
  suggestions = [],
  placeholder,
  listId,
}) => {
  const normalized = useMemo(
    () => suggestions.filter(Boolean).map((item) => item.trim()),
    [suggestions],
  );

  return (
    <>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        list={listId}
      />
      <datalist id={listId}>
        {normalized.map((option) => (
          <option value={option} key={`${listId}-${option}`} />
        ))}
      </datalist>
    </>
  );
};

export default AutoCompleteInput;
