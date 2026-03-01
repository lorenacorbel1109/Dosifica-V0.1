import React, { createContext, useContext, useMemo, useState } from 'react';

const AppModeStoreContext = createContext(null);

/**
 * Store global de modo de aplicación.
 * - simulation: entrenamiento (sin registro legal)
 * - production: operación real (con trazabilidad)
 */
export const AppModeStoreProvider = ({ children }) => {
  const [mode, setMode] = useState('simulation');

  const isSimulation = mode === 'simulation';
  const isProduction = mode === 'production';

  const value = useMemo(
    () => ({
      mode,
      setMode,
      isSimulation,
      isProduction,
    }),
    [mode, isSimulation, isProduction],
  );

  return <AppModeStoreContext.Provider value={value}>{children}</AppModeStoreContext.Provider>;
};

export const useAppModeStore = () => {
  const context = useContext(AppModeStoreContext);
  if (!context) {
    throw new Error('useAppModeStore debe usarse dentro de AppModeStoreProvider');
  }
  return context;
};
