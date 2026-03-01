/**
 * Construye registros de auditoría a partir de resultados del motor.
 * Módulo desacoplado: no altera resultados clínicos.
 */

/**
 * @param {object} params
 * @param {object[]} params.engineResults
 * @param {object} params.patientSnapshot
 * @param {string} params.establishmentId
 * @param {string} params.resolutionLevel
 * @returns {object[]}
 */
export const buildAuditEntries = ({
  engineResults = [],
  patientSnapshot = {},
  establishmentId = '',
  resolutionLevel = '',
}) => {
  const timestamp = new Date().toISOString();

  return engineResults.map((result, index) => ({
    auditId: `AUD-${Date.now()}-${index + 1}`,
    timestamp,
    establishmentId,
    patientSnapshot,
    ruleApplied: result.id,
    diagnosis: result.diagnosis,
    severity: result.severity,
    resolutionLevel,
    medication: result.treatmentPlan?.selectedTreatment || null,
    dose: result.treatmentPlan?.dosage || null,
    referral: Boolean(result.requiresReferral || result.isReferral),
    alerts: result.alerts || [],
  }));
};
