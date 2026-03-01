import React, { createContext, useContext, useMemo, useState } from 'react';

const DecisionLogStoreContext = createContext(null);

const makeDecisionId = () => `DEC-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

/**
 * Store para trazabilidad legal de decisiones clínicas confirmadas por médico.
 */
export const DecisionLogStoreProvider = ({ children }) => {
  const [decisions, setDecisions] = useState([]);

  const addDecision = (decisionPayload) => {
    const entry = {
      decisionId: makeDecisionId(),
      auditId: decisionPayload.auditId || '',
      clinicianId: decisionPayload.clinicianId || '',
      diagnosisSuggested: decisionPayload.diagnosisSuggested || '',
      diagnosisFinal: decisionPayload.diagnosisFinal || '',
      treatmentSuggested: decisionPayload.treatmentSuggested || '',
      treatmentFinal: decisionPayload.treatmentFinal || '',
      notes: decisionPayload.notes || '',
      confirmedAt: decisionPayload.confirmedAt || new Date().toISOString(),
    };

    setDecisions((prev) => [entry, ...prev]);
    return entry;
  };

  const clearDecisions = () => setDecisions([]);

  const exportDecisionsJson = () => JSON.stringify(decisions, null, 2);

  const value = useMemo(
    () => ({
      decisions,
      addDecision,
      clearDecisions,
      exportDecisionsJson,
    }),
    [decisions],
  );

  return <DecisionLogStoreContext.Provider value={value}>{children}</DecisionLogStoreContext.Provider>;
};

export const useDecisionLogStore = () => {
  const context = useContext(DecisionLogStoreContext);
  if (!context) {
    throw new Error('useDecisionLogStore debe usarse dentro de DecisionLogStoreProvider');
  }
  return context;
};
