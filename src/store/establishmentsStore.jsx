import React, { createContext, useContext, useMemo, useState } from 'react';

/**
 * Store multi-establecimiento con inventario por sede.
 * Mantiene:
 * - establecimientos
 * - establecimiento activo
 * - tabla lógica establishment_inventory
 */
const EstablishmentsStoreContext = createContext(null);
const INVENTORY_STORAGE_KEY = 'establishment_inventory';

const initialEstablishments = [
  {
    id: 'EST-001',
    name: 'Centro de Salud I-1 Demo',
    level: 'I-1',
    medicationsAvailable: [],
    equipmentAvailable: [],
  },
  {
    id: 'EST-002',
    name: 'Hospital Local I-3 Demo',
    level: 'I-3',
    medicationsAvailable: ['SRO', 'Albendazol'],
    equipmentAvailable: ['venoclisis'],
  },
];

const normalizeText = (value) => String(value ?? '').trim();

const nowIso = () => new Date().toISOString();

const normalizeInventoryItem = (item) => ({
  id: normalizeText(item.id),
  establishmentId: normalizeText(item.establishmentId),
  nationalMedicationId: normalizeText(item.nationalMedicationId),
  stock: Number(item.stock ?? 0),
  expirationDate: item.expirationDate ? normalizeText(item.expirationDate) : '',
  isAvailable: item.isAvailable === true,
  lastUpdated: item.lastUpdated || nowIso(),
  medicationName: normalizeText(item.medicationName),
  route: normalizeText(item.route),
  pharmaceuticalForm: normalizeText(item.pharmaceuticalForm),
});

const safeLoadInventory = () => {
  try {
    const raw = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeInventoryItem).filter((item) => item.id && item.establishmentId && item.nationalMedicationId);
  } catch {
    return [];
  }
};

const persistInventory = (rows) => {
  try {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(rows));
  } catch {
    // noop
  }
};

const buildAvailableMedicationNames = (inventoryRows, establishmentId) => {
  return inventoryRows
    .filter((item) => item.establishmentId === establishmentId)
    .filter((item) => item.isAvailable && Number(item.stock) > 0)
    .map((item) => item.medicationName)
    .filter(Boolean)
    .filter((value, index, arr) => arr.indexOf(value) === index);
};

const csvToRows = (csvText, establishmentId, nationalMedications) => {
  const lines = String(csvText || '').split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((token) => token.trim().toLowerCase());
  const byId = new Map(nationalMedications.map((item) => [item.id, item]));
  const byName = new Map(nationalMedications.map((item) => [item.genericName.toLowerCase(), item]));

  return lines.slice(1).map((line, index) => {
    const values = line.split(',').map((token) => token.trim());
    const row = Object.fromEntries(headers.map((header, i) => [header, values[i] ?? '']));

    const maybeId = row.nationalmedicationid || row.national_medication_id || row.idmedicamento || '';
    const maybeName = row.genericname || row.generic_name || row.nombre || '';

    const matchedById = byId.get(maybeId);
    const matchedByName = byName.get(String(maybeName).toLowerCase());
    const medication = matchedById || matchedByName;

    if (!medication) return null;

    const stock = Number(row.stock ?? row.cantidad ?? 0);

    return normalizeInventoryItem({
      id: row.id || `INV-CSV-${Date.now()}-${index + 1}`,
      establishmentId,
      nationalMedicationId: medication.id,
      medicationName: medication.genericName,
      route: medication.route,
      pharmaceuticalForm: medication.pharmaceuticalForm,
      stock: Number.isNaN(stock) ? 0 : stock,
      expirationDate: row.expirationdate || row.expiration_date || row.vencimiento || '',
      isAvailable: String(row.isavailable ?? row.disponible ?? '').toLowerCase() === 'false'
        ? false
        : (Number.isNaN(stock) ? 0 : stock) > 0,
      lastUpdated: nowIso(),
    });
  }).filter(Boolean);
};

export const EstablishmentsStoreProvider = ({ children }) => {
  const [establishments, setEstablishments] = useState(initialEstablishments);
  const [activeEstablishmentId, setActiveEstablishmentId] = useState(initialEstablishments[0].id);
  const [establishmentInventory, setEstablishmentInventory] = useState(safeLoadInventory);

  const activeEstablishment = useMemo(
    () => {
      const selected = establishments.find((item) => item.id === activeEstablishmentId) || null;
      if (!selected) return null;

      return {
        ...selected,
        medicationsAvailable: buildAvailableMedicationNames(establishmentInventory, selected.id),
      };
    },
    [establishments, activeEstablishmentId, establishmentInventory],
  );

  const addEstablishment = (establishment) => {
    if (!establishment?.id || !establishment?.name) return;

    setEstablishments((prev) => {
      if (prev.some((item) => item.id === establishment.id)) return prev;
      return [
        ...prev,
        {
          id: establishment.id,
          name: establishment.name,
          level: establishment.level || 'I-1',
          medicationsAvailable: [],
          equipmentAvailable: Array.isArray(establishment.equipmentAvailable)
            ? establishment.equipmentAvailable
            : [],
        },
      ];
    });
  };

  const setActiveEstablishment = (id) => setActiveEstablishmentId(id);

  const updateActiveField = (field, value) => {
    setEstablishments((prev) =>
      prev.map((item) => (item.id === activeEstablishmentId ? { ...item, [field]: value } : item)),
    );
  };

  const associateNationalMedicationToEstablishment = ({
    establishmentId = activeEstablishmentId,
    nationalMedication,
    stock = 0,
    expirationDate = '',
    isAvailable,
  }) => {
    if (!establishmentId || !nationalMedication?.id) return false;

    const normalizedStock = Math.max(0, Number(stock || 0));
    const available = typeof isAvailable === 'boolean' ? isAvailable : normalizedStock > 0;

    setEstablishmentInventory((prev) => {
      const existing = prev.find(
        (item) => item.establishmentId === establishmentId && item.nationalMedicationId === nationalMedication.id,
      );

      if (existing) {
        const next = prev.map((item) => (
          item.id === existing.id
            ? normalizeInventoryItem({
                ...item,
                stock: normalizedStock,
                expirationDate,
                isAvailable: available,
                medicationName: nationalMedication.genericName,
                route: nationalMedication.route,
                pharmaceuticalForm: nationalMedication.pharmaceuticalForm,
                lastUpdated: nowIso(),
              })
            : item
        ));
        persistInventory(next);
        return next;
      }

      const next = [
        ...prev,
        normalizeInventoryItem({
          id: `INV-${Date.now()}-${Math.round(Math.random() * 1000)}`,
          establishmentId,
          nationalMedicationId: nationalMedication.id,
          stock: normalizedStock,
          expirationDate,
          isAvailable: available,
          lastUpdated: nowIso(),
          medicationName: nationalMedication.genericName,
          route: nationalMedication.route,
          pharmaceuticalForm: nationalMedication.pharmaceuticalForm,
        }),
      ];
      persistInventory(next);
      return next;
    });

    return true;
  };

  const updateInventoryStock = (inventoryId, stock) => {
    const normalizedStock = Math.max(0, Number(stock || 0));
    setEstablishmentInventory((prev) => {
      const next = prev.map((item) => (
        item.id === inventoryId
          ? {
              ...item,
              stock: normalizedStock,
              isAvailable: normalizedStock > 0 ? item.isAvailable : false,
              lastUpdated: nowIso(),
            }
          : item
      ));
      persistInventory(next);
      return next;
    });
  };

  const setInventoryAvailability = (inventoryId, isAvailable) => {
    setEstablishmentInventory((prev) => {
      const next = prev.map((item) => (
        item.id === inventoryId
          ? { ...item, isAvailable: Boolean(isAvailable), lastUpdated: nowIso() }
          : item
      ));
      persistInventory(next);
      return next;
    });
  };

  const importInventoryCsv = (csvText, nationalMedications, establishmentId = activeEstablishmentId) => {
    const rows = csvToRows(csvText, establishmentId, nationalMedications);
    if (!rows.length) return 0;

    setEstablishmentInventory((prev) => {
      const map = new Map(prev.map((item) => [`${item.establishmentId}::${item.nationalMedicationId}`, item]));
      rows.forEach((row) => {
        map.set(`${row.establishmentId}::${row.nationalMedicationId}`, row);
      });
      const next = [...map.values()];
      persistInventory(next);
      return next;
    });

    return rows.length;
  };

  const removeMedicationFromActive = (medicationName) => {
    setEstablishmentInventory((prev) => {
      const next = prev.map((item) => (
        item.establishmentId === activeEstablishmentId && item.medicationName === medicationName
          ? { ...item, isAvailable: false, stock: 0, lastUpdated: nowIso() }
          : item
      ));
      persistInventory(next);
      return next;
    });
  };

  const addMedicationToActive = (medicationName) => {
    setEstablishmentInventory((prev) => {
      const existing = prev.find(
        (item) => item.establishmentId === activeEstablishmentId && item.medicationName === medicationName,
      );
      if (!existing) return prev;
      const next = prev.map((item) => (
        item.id === existing.id
          ? {
              ...item,
              isAvailable: true,
              stock: Math.max(1, Number(existing.stock || 0)),
              lastUpdated: nowIso(),
            }
          : item
      ));
      persistInventory(next);
      return next;
    });
  };

  const addEquipmentToActive = (equipment) => {
    const normalized = String(equipment || '').trim();
    if (!normalized) return;

    setEstablishments((prev) =>
      prev.map((item) => {
        if (item.id !== activeEstablishmentId) return item;
        if (item.equipmentAvailable.includes(normalized)) return item;
        return { ...item, equipmentAvailable: [...item.equipmentAvailable, normalized] };
      }),
    );
  };

  const removeEquipmentFromActive = (equipment) => {
    setEstablishments((prev) =>
      prev.map((item) => (
        item.id === activeEstablishmentId
          ? {
              ...item,
              equipmentAvailable: item.equipmentAvailable.filter((entry) => entry !== equipment),
            }
          : item
      )),
    );
  };

  const inventoryForActiveEstablishment = useMemo(
    () => establishmentInventory.filter((item) => item.establishmentId === activeEstablishmentId),
    [establishmentInventory, activeEstablishmentId],
  );

  const value = useMemo(
    () => ({
      tableName: 'establishment_inventory',
      establishments,
      activeEstablishmentId,
      activeEstablishment,
      establishmentInventory,
      inventoryForActiveEstablishment,
      addEstablishment,
      setActiveEstablishment,
      updateActiveField,
      associateNationalMedicationToEstablishment,
      updateInventoryStock,
      setInventoryAvailability,
      importInventoryCsv,
      addMedicationToActive,
      removeMedicationFromActive,
      addEquipmentToActive,
      removeEquipmentFromActive,
    }),
    [
      establishments,
      activeEstablishmentId,
      activeEstablishment,
      establishmentInventory,
      inventoryForActiveEstablishment,
    ],
  );

  return (
    <EstablishmentsStoreContext.Provider value={value}>
      {children}
    </EstablishmentsStoreContext.Provider>
  );
};

export const useEstablishmentsStore = () => {
  const context = useContext(EstablishmentsStoreContext);
  if (!context) {
    throw new Error('useEstablishmentsStore debe usarse dentro de EstablishmentsStoreProvider');
  }
  return context;
};
