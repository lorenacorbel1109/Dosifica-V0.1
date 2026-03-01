import React, { createContext, useContext, useMemo, useState } from 'react';

const AuditStoreContext = createContext(null);

/**
 * Store de auditoría clínica en memoria.
 */
export const AuditStoreProvider = ({ children }) => {
  const [auditLogs, setAuditLogs] = useState([]);

  const addAuditEntries = (entries = []) => {
    if (!Array.isArray(entries) || !entries.length) return;
    setAuditLogs((prev) => [...entries, ...prev]);
  };

  /**
   * Registra la aceptación explícita de responsabilidad clínica.
   */
  const addResponsibilityAcceptance = ({ establishmentId = '', simulateMode = false } = {}) => {
    const acceptanceEntry = {
      auditId: `RESP-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'responsibility_acceptance',
      establishmentId,
      simulateMode,
      message:
        'Aceptación de responsabilidad: el sistema es herramienta de apoyo y la decisión final corresponde al profesional.',
    };

    setAuditLogs((prev) => [acceptanceEntry, ...prev]);
    return acceptanceEntry;
  };

  const clearAuditLogs = () => setAuditLogs([]);

  const exportAuditJson = () => JSON.stringify(auditLogs, null, 2);

  const value = useMemo(
    () => ({
      auditLogs,
      addAuditEntries,
      addResponsibilityAcceptance,
      clearAuditLogs,
      exportAuditJson,
    }),
    [auditLogs],
  );

  return <AuditStoreContext.Provider value={value}>{children}</AuditStoreContext.Provider>;
};

export const useAuditStore = () => {
  const context = useContext(AuditStoreContext);
  if (!context) {
    throw new Error('useAuditStore debe usarse dentro de AuditStoreProvider');
  }
  return context;
};
