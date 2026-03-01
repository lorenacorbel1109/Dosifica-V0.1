/**
 * @typedef {Object} PatientData
 * @property {number} edad
 * @property {number} peso
 * @property {"M"|"F"|"Otro"} sexo
 * @property {string[]} sintomas
 * @property {string[]} signos
 * @property {Record<string, string|number|boolean>} laboratorio
 * @property {"I-1"|"I-2"|"I-3"|"I-4"} nivelResolutivo
 * @property {string[]} medicamentosDisponibles
 * @property {string[]} equiposDisponibles
 */

/**
 * Tipo documental de condición evaluable por el motor.
 *
 * @typedef {Object} RuleCondition
 * @property {string} field - Campo del paciente (admite dot-path, p.ej. "laboratorio.hemoglobina").
 * @property {"equals"|"greaterThan"|"lessThan"|"includes"|"notIncludes"} operator
 * @property {*} value
 */

/**
 * Tipo documental de regla clínica JSON editable.
 *
 * @typedef {Object} ClinicalRule
 * @property {string} id
 * @property {string} pathology
 * @property {RuleCondition[]} conditions
 * @property {string} diagnosis
 * @property {string} severity
 * @property {{
 *   firstLine: string,
 *   alternative?: string,
 *   doseFormula?: string,
 *   indications?: string[]
 * }} treatment
 * @property {string} referralCriteria
 */

export {}; // Archivo de tipos documentales (JSDoc)
