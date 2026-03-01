import { evaluateRules } from './ruleEvaluator.js';
import { calculateDosage } from './dosageCalculator.js';
import { isResourceAvailable, normalizeText } from '../utils/helpers.js';

const CARE_LEVEL_RANK = {
  'I-1': 1,
  'I-2': 2,
  'I-3': 3,
  'I-4': 4,
};

const toArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);

const getRequiredLevels = (rule) => {
  const levelField = rule.levelRestriction ?? rule.levelRequired ?? rule.requiredCareLevel;
  return toArray(levelField);
};

const meetsAnyRequiredLevel = (requiredLevels, facilityLevel) => {
  if (!requiredLevels.length) return true;
  const facilityRank = CARE_LEVEL_RANK[facilityLevel] || 0;
  return requiredLevels.some((level) => facilityRank >= (CARE_LEVEL_RANK[level] || 0));
};

const getDiagnosis = (rule) => rule.diagnosis || rule.result?.classification || rule.name || 'Sin clasificación';
const getSeverity = (rule) => rule.severity || rule.result?.severity || '';
const getPathology = (rule) => rule.pathology || rule.pathologyId || 'general';

const getCompositeResult = (rule) => {
  const explicit = rule.compositeResult;
  if (explicit && typeof explicit === 'object') {
    return {
      primaryClassification: explicit.primaryClassification || getDiagnosis(rule),
      secondaryClassification: explicit.secondaryClassification || '',
      tertiaryClassification: explicit.tertiaryClassification || '',
    };
  }

  return {
    primaryClassification: getDiagnosis(rule),
    secondaryClassification: rule.result?.morphology || rule.morphology || '',
    tertiaryClassification: rule.result?.medullaryResponse || rule.medullaryResponse || '',
  };
};

const getManagementPlan = (rule) => {
  if (rule.managementPlan && typeof rule.managementPlan === 'object') {
    return {
      id: rule.managementPlan.id || rule.managementPlanId || '',
      name: rule.managementPlan.name || rule.managementPlanId || '',
      description: rule.managementPlan.description || '',
    };
  }

  return {
    id: rule.managementPlanId || '',
    name: rule.managementPlanId || '',
    description: rule.managementDescription || '',
  };
};

const getRuleSpecificMedications = (rule) => {
  const direct = toArray(rule.specificMedications);
  if (direct.length) return direct;

  const required = toArray(rule.requiredMedications);
  if (required.length) return required;

  const fromTreatment = [rule.treatment?.firstLine, rule.treatment?.alternative].filter(Boolean);
  return fromTreatment;
};

const hasRequiredResources = (requiredMedications = [], availableMedications = []) => {
  const required = toArray(requiredMedications).map(normalizeText);
  const available = toArray(availableMedications).map(normalizeText);
  return required.every((item) => available.includes(item));
};

const resolveTreatmentByAvailability = (treatment = {}, medicationsAvailable = []) => {
  const firstLineAvailable = isResourceAvailable(medicationsAvailable, treatment.firstLine);

  if (firstLineAvailable) {
    return { selected: treatment.firstLine, fallbackUsed: false, unavailable: false };
  }

  if (treatment.alternative && isResourceAvailable(medicationsAvailable, treatment.alternative)) {
    return { selected: treatment.alternative, fallbackUsed: true, unavailable: false };
  }

  return {
    selected: treatment.firstLine || null,
    fallbackUsed: false,
    unavailable: Boolean(treatment.firstLine),
  };
};

const shouldReferByHospitalizationConstraint = (rule, facilityLevel) => {
  const requiresHospitalization = Boolean(rule.requiresHospitalization);
  return requiresHospitalization && facilityLevel === 'I-1';
};

const getTreatmentConfig = (rule) => {
  if (rule.treatment) return rule.treatment;

  if (rule.managementPlan?.treatment) return rule.managementPlan.treatment;

  if (rule.managementPlanId) {
    return {
      firstLine: rule.managementPlanId,
      alternative: '',
      doseFormula: '',
      indications: [],
    };
  }

  return {};
};


const isMedicationAllowedForLevel = (medication, facilityLevel) => {
  const allowedLevels = toArray(medication?.allowedLevels);
  if (!allowedLevels.length) return true;
  return allowedLevels.includes(facilityLevel);
};

const matchesAltitudeConstraint = (rule, patientData, altitudeConfig) => {
  const patientAltitude = Number(patientData.altitud ?? patientData.altitude ?? 0);
  const maxMsnm = Number(altitudeConfig?.maxMsnm ?? 500);

  if (Number.isNaN(patientAltitude)) return false;

  if (rule.altitudeRange && typeof rule.altitudeRange === 'object') {
    const min = Number(rule.altitudeRange.min ?? 0);
    const max = Number(rule.altitudeRange.max ?? maxMsnm);
    return patientAltitude >= min && patientAltitude <= max;
  }

  if (typeof rule.altitudeMaxMsnm === 'number') {
    return patientAltitude <= rule.altitudeMaxMsnm;
  }

  return patientAltitude <= maxMsnm;
};

const buildTherapeuticMedications = ({
  specificMedications,
  nationalMedications,
  establishmentInventory,
  establishmentId,
  facilityLevel,
  rule,
}) => {
  const normalizedSuggested = specificMedications.map((item) => normalizeText(item)).filter(Boolean);

  const recommended = nationalMedications.filter((medication) => {
    if (medication.active === false) return false;
    if (!isMedicationAllowedForLevel(medication, facilityLevel)) return false;

    const byName = normalizedSuggested.includes(normalizeText(medication.genericName));
    const byId = normalizedSuggested.includes(normalizeText(medication.id));
    return byName || byId;
  });

  const inventoryRows = establishmentInventory.filter((item) => item.establishmentId === establishmentId);
  const levelAllowed = meetsAnyRequiredLevel(getRequiredLevels(rule), facilityLevel);

  const available = recommended.filter((medication) => {
    if (!levelAllowed) return false;

    const inventoryMatch = inventoryRows.find((row) => row.nationalMedicationId === medication.id);
    if (!inventoryMatch) return false;

    return Boolean(inventoryMatch.isAvailable) && Number(inventoryMatch.stock) > 0;
  });

  const availableSet = new Set(available.map((item) => item.id));
  const unavailable = recommended.filter((item) => !availableSet.has(item.id));

  return {
    recommended,
    available,
    unavailable,
    noneAvailableAlert: recommended.length > 0 && available.length === 0
      ? 'No disponible en establecimiento'
      : '',
  };
};

/**
 * Ejecuta reglas dinámicas y retorna recomendaciones clínicas integradas con inventario.
 */
export const runRuleEngine = ({ rules = [], patientData, unmetPolicy = 'reference', altitudeConfig }) => {
  const matchedRules = evaluateRules(rules, patientData);

  const levelFilteredRules = matchedRules.filter((rule) =>
    meetsAnyRequiredLevel(getRequiredLevels(rule), patientData.nivelResolutivo),
  );

  const altitudeFilteredRules = levelFilteredRules.filter((rule) =>
    matchesAltitudeConstraint(rule, patientData, altitudeConfig),
  );

  return altitudeFilteredRules
    .map((rule) => {
      const specificMedications = getRuleSpecificMedications(rule);
      const strictRequiredMedications = toArray(rule.requiredMedications);
      const medsOk = strictRequiredMedications.length
        ? hasRequiredResources(strictRequiredMedications, patientData.medicamentosDisponibles || [])
        : true;
      const hospitalizationConstraint = shouldReferByHospitalizationConstraint(rule, patientData.nivelResolutivo);

      if ((hospitalizationConstraint || !medsOk) && unmetPolicy === 'exclude') {
        return null;
      }

      const availableCatalog = toArray(patientData.medicamentosDisponibles || []);
      const medicationAvailable = specificMedications.filter((medication) =>
        availableCatalog.map(normalizeText).includes(normalizeText(medication)),
      );

      const therapeuticMedications = buildTherapeuticMedications({
        specificMedications,
        nationalMedications: toArray(patientData.nationalMedications),
        establishmentInventory: toArray(patientData.establishmentInventory),
        establishmentId: patientData.establishmentId,
        facilityLevel: patientData.nivelResolutivo,
        rule,
      });

      const managementPlan = getManagementPlan(rule);
      const treatment = getTreatmentConfig(rule);
      const compositeResult = getCompositeResult(rule);
      const definitiveTreatmentAllowed = !hospitalizationConstraint;
      const resolvedTreatment = definitiveTreatmentAllowed
        ? resolveTreatmentByAvailability(treatment, availableCatalog)
        : { selected: null, fallbackUsed: false, unavailable: false };

      const classification = compositeResult.primaryClassification;
      const severity = getSeverity(rule);
      const planRecommended = managementPlan.description || managementPlan.name || treatment.firstLine || '';

      const aggregatedAlerts = [
        hospitalizationConstraint ? 'Requiere hospitalización y establecimiento actual no puede resolver.' : null,
        !medsOk ? 'No se cumplen medicamentos requeridos para el plan.' : null,
        therapeuticMedications.noneAvailableAlert || null,
      ].filter(Boolean);

      return {
        id: rule.id,
        pathology: getPathology(rule),
        classification,
        diagnosis: classification,
        severity,
        morphology: compositeResult.secondaryClassification,
        medullaryResponse: compositeResult.tertiaryClassification,
        compositeResult,
        priority: Number(rule.priority || 0),
        planRecommended,
        managementPlan,
        specificMedications,
        medicationAvailable,
        therapeuticMedications: {
          recommended: therapeuticMedications.recommended,
          available: therapeuticMedications.available,
          unavailable: therapeuticMedications.unavailable,
        },
        requiresReferral: hospitalizationConstraint || !medsOk,
        referralReason: hospitalizationConstraint
          ? 'Nivel resolutivo insuficiente para hospitalización.'
          : !medsOk
            ? 'Medicamentos específicos no disponibles en inventario activo.'
            : therapeuticMedications.noneAvailableAlert || '',
        isReferral: hospitalizationConstraint || !medsOk,
        alerts: aggregatedAlerts,
        treatmentPlan: {
          firstLine: treatment?.firstLine,
          alternative: treatment?.alternative,
          definitiveTreatmentAllowed,
          selectedTreatment: resolvedTreatment.selected,
          usedAlternative: resolvedTreatment.fallbackUsed,
          unavailableMedication: resolvedTreatment.unavailable,
          requiredResourcesAvailable: medsOk,
          dosage: definitiveTreatmentAllowed
            ? calculateDosage(treatment?.dose || treatment?.doseFormula, patientData)
            : {
                dosisFinal: null,
                frecuencia: '',
                advertenciaSiAplica: 'Tratamiento definitivo no permitido en este nivel resolutivo.',
                unit: '',
                description: 'Derivar a mayor nivel para manejo definitivo.',
                value: null,
              },
          indications: treatment?.indications || [],
          outpatientAllowed: rule.outpatientAllowed !== false,
          requiresHospitalization: Boolean(rule.requiresHospitalization),
        },
        referralCriteria: rule.referralCriteria,
      };
    })
    .filter(Boolean);
};
