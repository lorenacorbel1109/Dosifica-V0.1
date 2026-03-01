/**
 * Variables numéricas permitidas para fórmulas dinámicas.
 * No se usa eval; se parsea de forma controlada.
 */
const ALLOWED_VARIABLES = new Set(['peso', 'edad', 'talla', 'superficie', 'imc', 'creatinina', 'mgPorKg', 'dosisMaxima']);

/**
 * Clasificación etaria simple para trazabilidad clínica de posología.
 * - Neonatos: < 0.08 años (~28 días)
 * - Pediátricos: >= 0.08 y < 18
 * - Adultos: >= 18
 *
 * @param {number} edad
 * @returns {'neonato'|'pediatrico'|'adulto'}
 */
const getAgeGroup = (edad) => {
  const safeAge = Number(edad || 0);
  if (safeAge < 0.08) return 'neonato';
  if (safeAge < 18) return 'pediatrico';
  return 'adulto';
};

/**
 * Tokeniza expresiones matemáticas seguras.
 * Soporta números, variables permitidas, + - * / y paréntesis.
 *
 * @param {string} expression
 * @returns {Array<{type: 'number'|'variable'|'operator'|'paren', value: string}>}
 */
const tokenizeExpression = (expression) => {
  const sanitized = expression.replace(/\s+/g, '');
  const tokens = [];
  let i = 0;

  while (i < sanitized.length) {
    const char = sanitized[i];

    if (/[0-9.]/.test(char)) {
      let number = char;
      i += 1;
      while (i < sanitized.length && /[0-9.]/.test(sanitized[i])) {
        number += sanitized[i];
        i += 1;
      }
      if (!/^(\d+\.?\d*|\d*\.\d+)$/.test(number)) {
        throw new Error(`Número inválido en expresión: ${number}`);
      }
      tokens.push({ type: 'number', value: number });
      continue;
    }

    if (/[a-zA-Z_]/.test(char)) {
      let identifier = char;
      i += 1;
      while (i < sanitized.length && /[a-zA-Z0-9_]/.test(sanitized[i])) {
        identifier += sanitized[i];
        i += 1;
      }
      if (!ALLOWED_VARIABLES.has(identifier)) {
        throw new Error(`Variable no permitida en fórmula: ${identifier}`);
      }
      tokens.push({ type: 'variable', value: identifier });
      continue;
    }

    if (['+', '-', '*', '/'].includes(char)) {
      tokens.push({ type: 'operator', value: char });
      i += 1;
      continue;
    }

    if (['(', ')'].includes(char)) {
      tokens.push({ type: 'paren', value: char });
      i += 1;
      continue;
    }

    throw new Error(`Carácter no permitido en fórmula: ${char}`);
  }

  return tokens;
};

const OP_PRECEDENCE = { '+': 1, '-': 1, '*': 2, '/': 2 };

/**
 * Convierte tokens infix a postfix (RPN) con shunting-yard.
 *
 * @param {ReturnType<typeof tokenizeExpression>} tokens
 * @returns {ReturnType<typeof tokenizeExpression>}
 */
const toRpn = (tokens) => {
  const output = [];
  const operators = [];

  tokens.forEach((token) => {
    if (token.type === 'number' || token.type === 'variable') {
      output.push(token);
      return;
    }

    if (token.type === 'operator') {
      while (operators.length) {
        const top = operators[operators.length - 1];
        if (
          top.type === 'operator' &&
          OP_PRECEDENCE[top.value] >= OP_PRECEDENCE[token.value]
        ) {
          output.push(operators.pop());
        } else {
          break;
        }
      }
      operators.push(token);
      return;
    }

    if (token.type === 'paren' && token.value === '(') {
      operators.push(token);
      return;
    }

    if (token.type === 'paren' && token.value === ')') {
      while (operators.length && operators[operators.length - 1].value !== '(') {
        output.push(operators.pop());
      }
      if (!operators.length) {
        throw new Error('Paréntesis desbalanceados en fórmula.');
      }
      operators.pop();
    }
  });

  while (operators.length) {
    const op = operators.pop();
    if (op.type === 'paren') {
      throw new Error('Paréntesis desbalanceados en fórmula.');
    }
    output.push(op);
  }

  return output;
};

/**
 * Evalúa expresión RPN usando contexto de variables permitidas.
 *
 * @param {ReturnType<typeof tokenizeExpression>} rpn
 * @param {Record<string, number>} context
 * @returns {number}
 */
const evaluateRpn = (rpn, context) => {
  const stack = [];

  rpn.forEach((token) => {
    if (token.type === 'number') {
      stack.push(Number(token.value));
      return;
    }

    if (token.type === 'variable') {
      stack.push(Number(context[token.value] || 0));
      return;
    }

    if (token.type === 'operator') {
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) {
        throw new Error('Fórmula inválida: faltan operandos.');
      }

      switch (token.value) {
        case '+':
          stack.push(a + b);
          break;
        case '-':
          stack.push(a - b);
          break;
        case '*':
          stack.push(a * b);
          break;
        case '/':
          if (b === 0) throw new Error('División entre cero no permitida.');
          stack.push(a / b);
          break;
        default:
          throw new Error(`Operador no permitido: ${token.value}`);
      }
    }
  });

  if (stack.length !== 1) {
    throw new Error('Fórmula inválida: no se pudo resolver de forma determinística.');
  }

  return Number(stack[0]);
};

/**
 * Evalúa una fórmula matemática segura con variables permitidas.
 *
 * @param {string} formula
 * @param {Record<string, number>} context
 * @returns {number}
 */
const evaluateSafeFormula = (formula, context) => {
  const tokens = tokenizeExpression(formula);
  const rpn = toRpn(tokens);
  return evaluateRpn(rpn, context);
};

/**
 * Normaliza salida con el formato nuevo y mantiene compatibilidad de campos.
 */
const buildDosageResult = ({
  dosisFinal,
  frecuencia = '',
  advertenciaSiAplica = '',
  unit = 'mg',
  description,
  ageGroup = '',
  superficieUsed = false,
  superficie = null,
}) => {
  const ageNote = ageGroup ? ` Grupo etario: ${ageGroup}.` : '';
  const superficieNote = superficieUsed && superficie !== null
    ? ` Superficie corporal: ${superficie} m².`
    : '';

  return {
    dosisFinal,
    frecuencia,
    advertenciaSiAplica,
    unit,
    description: `${description}${ageNote}${superficieNote}`.trim(),
    // Compatibilidad hacia atrás
    value: dosisFinal,
  };
};

/**
 * Calcula posología.
 *
 * Soporta:
 * 1) Definición estructurada:
 *    {
 *      mgPorKg: number,
 *      frecuencia: string,
 *      dosisMaxima?: number,
 *      formula?: string, // opcional (ej: "peso * mgPorKg")
 *      unit?: string
 *    }
 * 2) Fórmula legacy string:
 *    "75 ml * peso" | "500 mg"
 *
 * @param {string|{mgPorKg?: number, frecuencia?: string, dosisMaxima?: number, formula?: string, unit?: string}} doseDefinition
 * @param {{peso: number, edad: number, talla?: number, creatinina?: number}} patientData
 * @returns {{
 *  dosisFinal: number|null,
 *  frecuencia: string,
 *  advertenciaSiAplica: string,
 *  unit: string,
 *  description: string,
 *  value: number|null
 * }}
 */
export const calculateDosage = (doseDefinition, patientData = {}) => {
  const peso = Number(patientData.peso || 0);
  const edad = Number(patientData.edad || 0);
  const talla = Number(patientData.talla || 0);
  const creatinina = Number(patientData.creatinina || 0);
  const ageGroup = getAgeGroup(edad);

  const superficie = talla > 0
    ? Number(Math.sqrt((peso * talla) / 3600).toFixed(4))
    : 0;
  const imc = talla > 0
    ? Number((peso / ((talla / 100) ** 2)).toFixed(2))
    : 0;

  if (!doseDefinition) {
    return buildDosageResult({
      dosisFinal: null,
      frecuencia: '',
      advertenciaSiAplica: 'Sin dosis definida en la regla.',
      unit: '',
      description: 'Sin dosis definida en la regla.',
      ageGroup,
    });
  }

  // Nuevo formato recomendado
  if (typeof doseDefinition === 'object' && !Array.isArray(doseDefinition)) {
    const mgPorKg = Number(doseDefinition.mgPorKg || 0);
    const frecuencia = doseDefinition.frecuencia || '';
    const dosisMaxima =
      doseDefinition.dosisMaxima !== undefined ? Number(doseDefinition.dosisMaxima) : null;
    const unit = doseDefinition.unit || 'mg';

    const context = {
      peso,
      edad,
      talla,
      superficie,
      imc,
      creatinina,
      mgPorKg,
      dosisMaxima: dosisMaxima || 0,
    };

    let baseDose = 0;
    const formulaUsed = String(doseDefinition.formula || '').toLowerCase();
    const superficieUsed = formulaUsed.includes('superficie');

    try {
      if (doseDefinition.formula) {
        baseDose = evaluateSafeFormula(doseDefinition.formula, context);
      } else {
        baseDose = peso * mgPorKg;
      }
    } catch (error) {
      return buildDosageResult({
        dosisFinal: null,
        frecuencia,
        advertenciaSiAplica: `Error en fórmula: ${error.message}`,
        unit,
        description: `No se pudo calcular dosis para ${ageGroup}.`,
        ageGroup,
        superficieUsed,
        superficie,
      });
    }

    let finalDose = Number(baseDose.toFixed(2));
    let warning = '';

    if (dosisMaxima !== null && finalDose > dosisMaxima) {
      finalDose = Number(dosisMaxima.toFixed(2));
      warning = `Dosis ajustada al máximo permitido (${dosisMaxima} ${unit}).`;
    }

    return buildDosageResult({
      dosisFinal: finalDose,
      frecuencia,
      advertenciaSiAplica: warning,
      unit,
      description: `Dosis calculada para ${ageGroup}: ${finalDose} ${unit}.`,
      ageGroup,
      superficieUsed,
      superficie,
    });
  }

  // Compatibilidad con fórmula legacy string
  const cleaned = String(doseDefinition).replace(/\s+/g, ' ').trim();
  const legacyUsesSuperficie = cleaned.toLowerCase().includes('superficie');

  const byWeightPattern = /^(\d+(?:\.\d+)?)\s*([a-zA-Z%]+)\s*\*\s*peso$/i;
  const byWeightMatch = cleaned.match(byWeightPattern);

  if (byWeightMatch) {
    const factor = Number(byWeightMatch[1]);
    const unit = byWeightMatch[2];
    const value = Number((factor * peso).toFixed(2));

    return buildDosageResult({
      dosisFinal: value,
      frecuencia: '',
      advertenciaSiAplica: '',
      unit,
      description: `${value} ${unit} (calculado: ${factor} ${unit} x ${peso} kg)`,
      ageGroup,
      superficieUsed: legacyUsesSuperficie,
      superficie,
    });
  }

  const fixedDosePattern = /^(\d+(?:\.\d+)?)\s*([a-zA-Z%]+)$/i;
  const fixedDoseMatch = cleaned.match(fixedDosePattern);

  if (fixedDoseMatch) {
    const value = Number(fixedDoseMatch[1]);
    const unit = fixedDoseMatch[2];

    return buildDosageResult({
      dosisFinal: value,
      frecuencia: '',
      advertenciaSiAplica: '',
      unit,
      description: `${value} ${unit} (dosis fija)`,
      ageGroup,
      superficieUsed: legacyUsesSuperficie,
      superficie,
    });
  }

  return buildDosageResult({
    dosisFinal: null,
    frecuencia: '',
    advertenciaSiAplica: `No se pudo interpretar la fórmula: "${doseDefinition}"`,
    unit: '',
    description: `No se pudo interpretar la fórmula: "${doseDefinition}"`,
    ageGroup,
    superficieUsed: legacyUsesSuperficie,
    superficie,
  });
};

export { evaluateSafeFormula };
