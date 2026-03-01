import React, { createContext, useContext, useMemo, useState } from 'react';
import initialDataset from '../data/nationalMedications.json';

const NationalMedicationsStoreContext = createContext(null);
const STORAGE_KEY = 'national_medications';

const normalizeText = (value) => String(value ?? '').trim();

const normalizeMedication = (item) => ({
  id: normalizeText(item.id),
  genericName: normalizeText(item.genericName),
  atcCode: normalizeText(item.atcCode),
  concentration: normalizeText(item.concentration),
  pharmaceuticalForm: normalizeText(item.pharmaceuticalForm),
  route: normalizeText(item.route),
  presentation: normalizeText(item.presentation),
  minsaCategory: normalizeText(item.minsaCategory),
  indications: Array.isArray(item.indications)
    ? item.indications.map((entry) => normalizeText(entry)).filter(Boolean)
    : typeof item.indications === 'string'
      ? item.indications.split(';').map((entry) => normalizeText(entry)).filter(Boolean)
      : [],
  allowedLevels: Array.isArray(item.allowedLevels)
    ? item.allowedLevels.map((entry) => normalizeText(entry)).filter(Boolean)
    : typeof item.allowedLevels === 'string'
      ? item.allowedLevels.split(';').map((entry) => normalizeText(entry)).filter(Boolean)
      : ['I-1', 'I-2', 'I-3', 'I-4'],
  active: item.active !== false,
  source: item.source || 'base',
});

const safeLoad = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialDataset.map((entry) => normalizeMedication({ ...entry, source: 'base' }));
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) {
      return initialDataset.map((entry) => normalizeMedication({ ...entry, source: 'base' }));
    }
    return parsed.map((entry) => normalizeMedication(entry));
  } catch {
    return initialDataset.map((entry) => normalizeMedication({ ...entry, source: 'base' }));
  }
};

const persist = (rows) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    // noop
  }
};

const csvToRows = (csvText) => {
  const lines = String(csvText || '').split(/\r?\n/).filter((line) => line.trim().length);
  if (lines.length < 2) return [];

  const header = lines[0].split(',').map((token) => token.trim());
  return lines.slice(1).map((line, index) => {
    const values = line.split(',').map((token) => token.trim());
    const row = Object.fromEntries(header.map((key, i) => [key, values[i] ?? '']));
    return normalizeMedication({
      ...row,
      id: row.id || `CSV-${Date.now()}-${index + 1}`,
      indications: row.indications ? row.indications.split(';') : [],
      allowedLevels: row.allowedLevels ? row.allowedLevels.split(';') : ['I-1', 'I-2', 'I-3', 'I-4'],
      active: row.active ? String(row.active).toLowerCase() !== 'false' : true,
      source: 'imported',
    });
  });
};

export const NationalMedicationsStoreProvider = ({ children }) => {
  const [nationalMedications, setNationalMedications] = useState(safeLoad);

  const upsertMedication = (payload, source = 'manual') => {
    const normalized = normalizeMedication({ ...payload, source });
    if (!normalized.id || !normalized.genericName) return false;

    setNationalMedications((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === normalized.id);
      if (existingIndex === -1) {
        const next = [...prev, normalized];
        persist(next);
        return next;
      }

      const next = prev.map((item) => (item.id === normalized.id ? { ...item, ...normalized } : item));
      persist(next);
      return next;
    });

    return true;
  };

  const deactivateMedication = (id) => {
    setNationalMedications((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, active: false } : item));
      persist(next);
      return next;
    });
  };

  const activateMedication = (id) => {
    setNationalMedications((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, active: true } : item));
      persist(next);
      return next;
    });
  };

  const importFromCsv = (csvText) => {
    const rows = csvToRows(csvText);
    if (!rows.length) return 0;

    setNationalMedications((prev) => {
      const map = new Map(prev.map((item) => [item.id, item]));
      rows.forEach((row) => map.set(row.id, row));
      const next = [...map.values()];
      persist(next);
      return next;
    });

    return rows.length;
  };

  const loadFromJsonDataset = (jsonText) => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) return false;
      const next = parsed.map((item) => normalizeMedication({ ...item, source: 'manual' }));
      setNationalMedications(next);
      persist(next);
      return true;
    } catch {
      return false;
    }
  };

  const exportAsJson = () => JSON.stringify(nationalMedications, null, 2);

  const activeNationalMedications = useMemo(
    () => nationalMedications.filter((item) => item.active !== false),
    [nationalMedications],
  );

  const value = useMemo(
    () => ({
      tableName: 'national_medications',
      nationalMedications,
      activeNationalMedications,
      upsertMedication,
      deactivateMedication,
      activateMedication,
      importFromCsv,
      loadFromJsonDataset,
      exportAsJson,
    }),
    [nationalMedications, activeNationalMedications],
  );

  return (
    <NationalMedicationsStoreContext.Provider value={value}>
      {children}
    </NationalMedicationsStoreContext.Provider>
  );
};

export const useNationalMedicationsStore = () => {
  const context = useContext(NationalMedicationsStoreContext);
  if (!context) {
    throw new Error('useNationalMedicationsStore debe usarse dentro de NationalMedicationsStoreProvider');
  }
  return context;
};
