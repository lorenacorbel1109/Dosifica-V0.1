import React, { createContext, useContext, useMemo, useState } from 'react';

const VariablesStoreContext = createContext(null);
const STORAGE_KEY = 'clinical:variables:v1';

const defaultVariables = [
  { id: 'edad', name: 'Edad', type: 'number', unit: 'años' },
  { id: 'peso', name: 'Peso', type: 'number', unit: 'kg' },
  { id: 'sexo', name: 'Sexo', type: 'select', options: ['F', 'M', 'Otro'] },
  { id: 'gestante', name: 'Gestante', type: 'boolean' },
  { id: 'altitud', name: 'Altitud', type: 'number', unit: 'msnm' },
  { id: 'signos', name: 'Signos', type: 'select', options: ['mucosas secas', 'ojos hundidos', 'palidez'] },
  { id: 'laboratorio.hemoglobina', name: 'Hemoglobina', type: 'number', unit: 'g/dL' },
  { id: 'laboratorio.sodio', name: 'Sodio', type: 'number', unit: 'mmol/L' },
  {
    id: 'laboratorio.coproparasitoscopico',
    name: 'Hallazgo coproparasitoscópico',
    type: 'select',
    options: ['negativo', 'quistes giardia', 'huevos helmintos'],
  },
];

const safeLoadVariables = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultVariables;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : defaultVariables;
  } catch {
    return defaultVariables;
  }
};

const persistVariables = (variables) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(variables));
  } catch {
    // noop
  }
};

export const VariablesStoreProvider = ({ children }) => {
  const [variables, setVariables] = useState(safeLoadVariables);

  const addVariable = (payload) => {
    if (!payload?.id || !payload?.name || !payload?.type) return false;

    setVariables((prev) => {
      if (prev.some((item) => item.id === payload.id)) return prev;
      const next = [
        ...prev,
        {
          id: payload.id,
          name: payload.name,
          type: payload.type,
          unit: payload.unit || '',
          options: Array.isArray(payload.options) ? payload.options : [],
        },
      ];
      persistVariables(next);
      return next;
    });

    return true;
  };

  const updateVariable = (id, updates) => {
    setVariables((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, ...updates } : item));
      persistVariables(next);
      return next;
    });
  };

  const removeVariable = (id) => {
    setVariables((prev) => {
      const next = prev.filter((item) => item.id !== id);
      persistVariables(next);
      return next;
    });
  };

  const exportVariablesJson = () => JSON.stringify(variables, null, 2);

  const value = useMemo(
    () => ({ variables, addVariable, updateVariable, removeVariable, exportVariablesJson }),
    [variables],
  );

  return <VariablesStoreContext.Provider value={value}>{children}</VariablesStoreContext.Provider>;
};

export const useVariablesStore = () => {
  const context = useContext(VariablesStoreContext);
  if (!context) {
    throw new Error('useVariablesStore debe usarse dentro de VariablesStoreProvider');
  }
  return context;
};
