import { useMemo } from 'react';
import { runRuleEngine } from '../engine/ruleEngine.js';

export const useMemoizedEngine = ({ rules = [], patientData = {}, unmetPolicy = 'reference', altitudeConfig } = {}) => {
  return useMemo(() => {
    const hasPerformanceApi = typeof performance !== 'undefined' && typeof performance.now === 'function';
    const start = hasPerformanceApi ? performance.now() : Date.now();

    const results = runRuleEngine({
      rules,
      patientData,
      unmetPolicy,
      altitudeConfig,
    });

    const end = hasPerformanceApi ? performance.now() : Date.now();
    const elapsedMs = Math.round((end - start) * 100) / 100;

    if (import.meta.env.DEV && elapsedMs > 100) {
      console.warn('useMemoizedEngine: evaluación clínica lenta detectada', { elapsedMs, rules: rules.length });
    }

    return {
      results,
      elapsedMs,
      evaluatedAt: Date.now(),
    };
  }, [rules, patientData, unmetPolicy, altitudeConfig]);
};

export default useMemoizedEngine;
