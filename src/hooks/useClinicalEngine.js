import { useMemo } from 'react';
import { runRuleEngine } from '../engine/ruleEngine.js';

/**
 * Hook de integración entre UI y motor clínico.
 */
const useClinicalEngine = (rules = []) => {
  const evaluatePatient = useMemo(
    () => (patientData, options = {}) =>
      runRuleEngine({
        rules,
        patientData,
        unmetPolicy: options.unmetPolicy || 'reference',
      }),
    [rules],
  );

  return { evaluatePatient };
};

export default useClinicalEngine;
