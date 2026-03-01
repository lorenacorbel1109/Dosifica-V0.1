import { getValueByPath, normalizeText } from '../utils/helpers.js';

/**
 * Operadores legacy mantenidos para compatibilidad.
 */
const LEGACY_OPERATORS = {
  equals: (actual, expected) => {
    if (typeof actual === 'string' || typeof expected === 'string') {
      return normalizeText(actual) === normalizeText(expected);
    }
    return actual === expected;
  },

  greaterThan: (actual, expected) => Number(actual) > Number(expected),
  lessThan: (actual, expected) => Number(actual) < Number(expected),

  includes: (actual, expected) => {
    if (Array.isArray(actual)) {
      return actual.map(normalizeText).includes(normalizeText(expected));
    }

    if (typeof actual === 'string') {
      return normalizeText(actual).includes(normalizeText(expected));
    }

    return false;
  },

  notIncludes: (actual, expected) => {
    if (Array.isArray(actual)) {
      return !actual.map(normalizeText).includes(normalizeText(expected));
    }

    if (typeof actual === 'string') {
      return !normalizeText(actual).includes(normalizeText(expected));
    }

    return true;
  },
};

/**
 * Operadores nuevos para RuleDefinition dinámico.
 */
const COMPARISON_OPERATORS = {
  '<': (actual, expected) => Number(actual) < Number(expected),
  '>': (actual, expected) => Number(actual) > Number(expected),
  '<=': (actual, expected) => Number(actual) <= Number(expected),
  '>=': (actual, expected) => Number(actual) >= Number(expected),
  '=': (actual, expected) => {
    if (typeof actual === 'string' || typeof expected === 'string') {
      return normalizeText(actual) === normalizeText(expected);
    }
    return actual === expected;
  },
  '!=': (actual, expected) => {
    if (typeof actual === 'string' || typeof expected === 'string') {
      return normalizeText(actual) !== normalizeText(expected);
    }
    return actual !== expected;
  },
};

const OPERATOR_ALIASES = {
  equals: '=',
  greaterThan: '>',
  lessThan: '<',
};

const isConditionGroup = (node) =>
  Boolean(node)
  && typeof node === 'object'
  && Array.isArray(node.conditions)
  && (node.operator === 'AND' || node.operator === 'OR');

const isLegacyArrayConditionSet = (conditions) =>
  Array.isArray(conditions) && conditions.every((item) => !isConditionGroup(item));

const normalizeConditionValue = (condition) => {
  if (condition.type === 'number') {
    const numeric = Number(condition.value);
    return Number.isNaN(numeric) ? condition.value : numeric;
  }

  if (condition.type === 'boolean') {
    if (typeof condition.value === 'string') {
      return normalizeText(condition.value) === 'true';
    }
    return Boolean(condition.value);
  }

  return condition.value;
};

/**
 * Evalúa una condición individual (nuevo modelo RuleDefinition).
 */
export const evaluateRuleCondition = (condition, patientData) => {
  const operatorToken = OPERATOR_ALIASES[condition.operator] || condition.operator;
  const comparator = COMPARISON_OPERATORS[operatorToken] || LEGACY_OPERATORS[condition.operator];

  if (!comparator) {
    throw new Error(`Operador no soportado: ${condition.operator}`);
  }

  const actualValue = getValueByPath(patientData, condition.field);
  const expectedValue = normalizeConditionValue(condition);
  return comparator(actualValue, expectedValue);
};

/**
 * Evalúa ConditionGroup de forma recursiva con anidación infinita.
 */
export const evaluateConditionGroup = (group, patientData) => {
  if (!isConditionGroup(group)) {
    return false;
  }

  const evaluationResults = group.conditions.map((node) => {
    if (isConditionGroup(node)) {
      return evaluateConditionGroup(node, patientData);
    }

    return evaluateRuleCondition(node, patientData);
  });

  if (group.operator === 'AND') {
    return evaluationResults.every(Boolean);
  }

  return evaluationResults.some(Boolean);
};

/**
 * Evalúa una regla completa, soportando formato legacy y nuevo RuleDefinition.
 */
export const evaluateRule = (rule, patientData) => {
  if (!rule?.conditions) return false;

  if (isConditionGroup(rule.conditions)) {
    return evaluateConditionGroup(rule.conditions, patientData);
  }

  if (isLegacyArrayConditionSet(rule.conditions)) {
    return rule.conditions.every((condition) => evaluateRuleCondition(condition, patientData));
  }

  return false;
};

/**
 * Evalúa múltiples reglas dinámicas, ordenando por prioridad descendente.
 * Devuelve todas las que cumplen para permitir tomar la primera o múltiples.
 *
 * @param {Array<object>} rules
 * @param {Record<string, any>} patientData
 * @returns {Array<object>}
 */
export const evaluateRules = (rules = [], patientData = {}) => {
  return rules
    .filter((rule) => rule?.active !== false)
    .filter((rule) => evaluateRule(rule, patientData))
    .sort((left, right) => (Number(right.priority || 0) - Number(left.priority || 0)));
};

export { LEGACY_OPERATORS as OPERATORS, COMPARISON_OPERATORS };
