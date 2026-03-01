import React, { createContext, useContext, useMemo, useState } from 'react';
import {
  cloneRulesToVersion,
  ensureRuleVersionMetadata,
  getEvaluableRules,
  getRulesByVersion,
  getVersionSummary,
  setVersionActiveState,
} from '../engine/versionManager.js';
import defaultRulesJson from '../data/defaultRules.json';

const ClinicalStoreContext = createContext(null);
const DEFAULT_VERSION = 'NTS-2024';
const STORAGE_KEY = 'clinical:rules:v2';

const normalizeRules = (rules, activeVersion = DEFAULT_VERSION) =>
  (Array.isArray(rules) ? rules : []).map((rule) =>
    ensureRuleVersionMetadata(rule, {
      defaultVersion: rule.ntsVersion || activeVersion,
      preserveCreatedAt: true,
    }),
  );

const buildInitialRules = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return normalizeRules(defaultRulesJson, DEFAULT_VERSION);
    const parsed = JSON.parse(raw);
    return normalizeRules(parsed, DEFAULT_VERSION);
  } catch {
    return normalizeRules(defaultRulesJson, DEFAULT_VERSION);
  }
};

const persistRules = (rules) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
  } catch {
    // noop
  }
};

export const ClinicalStoreProvider = ({ children }) => {
  const [rules, setRules] = useState(buildInitialRules);
  const [activeNtsVersion, setActiveNtsVersion] = useState(DEFAULT_VERSION);

  const addRule = (rule) => {
    const normalized = ensureRuleVersionMetadata(rule, { defaultVersion: activeNtsVersion });
    setRules((prev) => {
      const next = [...prev, normalized];
      persistRules(next);
      return next;
    });
  };

  const updateRule = (index, nextRule) => {
    setRules((prev) => {
      const next = prev.map((rule, i) =>
        i === index
          ? ensureRuleVersionMetadata(
              { ...nextRule, createdAt: rule.createdAt || nextRule.createdAt },
              { defaultVersion: activeNtsVersion, preserveCreatedAt: true },
            )
          : rule,
      );
      persistRules(next);
      return next;
    });
  };

  const removeRule = (index) => {
    setRules((prev) => {
      const next = prev.filter((_, i) => i !== index);
      persistRules(next);
      return next;
    });
  };

  const replaceRules = (nextRules) => {
    const normalized = normalizeRules(nextRules, activeNtsVersion);
    persistRules(normalized);
    setRules(normalized);
  };

  const toggleVersionActive = (version, nextActive) => {
    setRules((prev) => {
      const next = setVersionActiveState(prev, version, nextActive);
      persistRules(next);
      return next;
    });
  };

  const cloneVersion = (sourceVersion, targetVersion) => {
    if (!sourceVersion || !targetVersion) return;
    setRules((prev) => {
      const next = cloneRulesToVersion(prev, sourceVersion, targetVersion);
      persistRules(next);
      return next;
    });
  };

  const versionSummary = useMemo(() => getVersionSummary(rules), [rules]);
  const rulesForActiveVersion = useMemo(
    () => getRulesByVersion(rules, activeNtsVersion),
    [rules, activeNtsVersion],
  );
  const evaluableRules = useMemo(
    () => getEvaluableRules(rules, activeNtsVersion),
    [rules, activeNtsVersion],
  );

  const value = useMemo(
    () => ({
      rules,
      evaluableRules,
      activeNtsVersion,
      setActiveNtsVersion,
      versionSummary,
      rulesForActiveVersion,
      addRule,
      updateRule,
      removeRule,
      replaceRules,
      toggleVersionActive,
      cloneVersion,
    }),
    [rules, evaluableRules, activeNtsVersion, versionSummary, rulesForActiveVersion],
  );

  return <ClinicalStoreContext.Provider value={value}>{children}</ClinicalStoreContext.Provider>;
};

export const useClinicalStore = () => {
  const context = useContext(ClinicalStoreContext);
  if (!context) {
    throw new Error('useClinicalStore debe usarse dentro de ClinicalStoreProvider');
  }
  return context;
};
