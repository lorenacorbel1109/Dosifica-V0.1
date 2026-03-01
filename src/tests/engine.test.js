import { describe, expect, it } from 'vitest';
import {
  evaluateRuleCondition,
  evaluateConditionGroup,
} from '../engine/ruleEvaluator.js';
import { calculateDosage } from '../engine/dosageCalculator.js';
import { runRuleEngine } from '../engine/ruleEngine.js';

describe('evaluateRuleCondition', () => {
  it('lessThan: 5 < 10 true, 10 < 5 false', () => {
    expect(
      evaluateRuleCondition(
        { field: 'valor', type: 'number', operator: 'lessThan', value: 10 },
        { valor: 5 },
      ),
    ).toBe(true);

    expect(
      evaluateRuleCondition(
        { field: 'valor', type: 'number', operator: 'lessThan', value: 5 },
        { valor: 10 },
      ),
    ).toBe(false);
  });

  it('greaterThan: 10 > 5 true', () => {
    expect(
      evaluateRuleCondition(
        { field: 'valor', type: 'number', operator: 'greaterThan', value: 5 },
        { valor: 10 },
      ),
    ).toBe(true);
  });

  it('equals con strings normalizados', () => {
    expect(
      evaluateRuleCondition(
        { field: 'diagnostico', type: 'select', operator: 'equals', value: 'anemia' },
        { diagnostico: 'Anemia' },
      ),
    ).toBe(true);
  });

  it('includes con array', () => {
    expect(
      evaluateRuleCondition(
        { field: 'signos', type: 'select', operator: 'includes', value: 'letargo' },
        { signos: ['ojos hundidos', 'letargo'] },
      ),
    ).toBe(true);
  });

  it('notIncludes con array', () => {
    expect(
      evaluateRuleCondition(
        { field: 'signos', type: 'select', operator: 'notIncludes', value: 'letargo' },
        { signos: ['fiebre'] },
      ),
    ).toBe(true);
  });

  it('operador inválido lanza Error', () => {
    expect(() =>
      evaluateRuleCondition(
        { field: 'valor', type: 'number', operator: 'INVALID', value: 1 },
        { valor: 2 },
      )).toThrowError('Operador no soportado');
  });
});

describe('evaluateConditionGroup', () => {
  it('AND con dos condiciones verdaderas -> true', () => {
    const group = {
      operator: 'AND',
      conditions: [
        { field: 'edad', type: 'number', operator: '>', value: 5 },
        { field: 'peso', type: 'number', operator: '>=', value: 10 },
      ],
    };

    expect(evaluateConditionGroup(group, { edad: 8, peso: 10 })).toBe(true);
  });

  it('AND con una condición falsa -> false', () => {
    const group = {
      operator: 'AND',
      conditions: [
        { field: 'edad', type: 'number', operator: '>', value: 5 },
        { field: 'peso', type: 'number', operator: '>=', value: 10 },
      ],
    };

    expect(evaluateConditionGroup(group, { edad: 8, peso: 9 })).toBe(false);
  });

  it('OR con una condición verdadera -> true', () => {
    const group = {
      operator: 'OR',
      conditions: [
        { field: 'edad', type: 'number', operator: '>', value: 12 },
        { field: 'signos', type: 'select', operator: 'includes', value: 'letargo' },
      ],
    };

    expect(evaluateConditionGroup(group, { edad: 8, signos: ['letargo'] })).toBe(true);
  });

  it('OR con todas falsas -> false', () => {
    const group = {
      operator: 'OR',
      conditions: [
        { field: 'edad', type: 'number', operator: '>', value: 12 },
        { field: 'signos', type: 'select', operator: 'includes', value: 'letargo' },
      ],
    };

    expect(evaluateConditionGroup(group, { edad: 8, signos: ['fiebre'] })).toBe(false);
  });

  it('grupos anidados: AND dentro de OR', () => {
    const group = {
      operator: 'OR',
      conditions: [
        {
          operator: 'AND',
          conditions: [
            { field: 'edad', type: 'number', operator: '>=', value: 18 },
            { field: 'gestante', type: 'boolean', operator: '=', value: true },
          ],
        },
        { field: 'signos', type: 'select', operator: 'includes', value: 'letargo' },
      ],
    };

    expect(evaluateConditionGroup(group, { edad: 22, gestante: true, signos: [] })).toBe(true);
    expect(evaluateConditionGroup(group, { edad: 10, gestante: false, signos: ['letargo'] })).toBe(true);
    expect(evaluateConditionGroup(group, { edad: 10, gestante: false, signos: ['fiebre'] })).toBe(false);
  });
});

describe('calculateDosage', () => {
  it('formato objeto (3 mg/kg, peso 15) -> 45', () => {
    const result = calculateDosage(
      { mgPorKg: 3, frecuencia: '1 vez al día', dosisMaxima: 60 },
      { peso: 15 },
    );

    expect(result.dosisFinal).toBe(45);
    expect(result.frecuencia).toBe('1 vez al día');
  });

  it('respeta dosis máxima (peso 25, 3 mg/kg, max 60) -> 60', () => {
    const result = calculateDosage(
      { mgPorKg: 3, frecuencia: '1 vez al día', dosisMaxima: 60 },
      { peso: 25 },
    );

    expect(result.dosisFinal).toBe(60);
    expect(result.advertenciaSiAplica).toContain('Dosis ajustada al máximo permitido');
  });

  it('fórmula legacy string "3 mg * peso" con peso 10 -> 30', () => {
    const result = calculateDosage('3 mg * peso', { peso: 10 });
    expect(result.dosisFinal).toBe(30);
  });

  it('dosis fija "500 mg" -> 500', () => {
    const result = calculateDosage('500 mg', { peso: 10 });
    expect(result.dosisFinal).toBe(500);
  });

  it('sin definición -> dosisFinal null', () => {
    const result = calculateDosage(undefined, { peso: 10 });
    expect(result.dosisFinal).toBeNull();
  });

  it('división por cero en fórmula -> dosisFinal null y advertencia', () => {
    const result = calculateDosage('10 mg * peso / 0', { peso: 10 });
    expect(result.dosisFinal).toBeNull();
    expect(result.advertenciaSiAplica).toContain('División entre cero no permitida');
  });

  it('calcula superficie e IMC internamente y permite usarlos en fórmula', () => {
    const result = calculateDosage(
      { formula: 'superficie * 10 + imc', frecuencia: 'c/24h', unit: 'mg' },
      { peso: 20, talla: 110, edad: 5 },
    );

    expect(result.dosisFinal).toBe(24.35);
    expect(result.description).toContain('Grupo etario: pediatrico.');
    expect(result.description).toContain('Superficie corporal: 0.7817 m².');
  });

  it('permite creatinina en fórmula y mantiene compatibilidad legacy', () => {
    const creatininaResult = calculateDosage(
      { formula: 'peso + creatinina * 10', unit: 'mg' },
      { peso: 30, talla: 140, creatinina: 1.2, edad: 25 },
    );
    const legacyResult = calculateDosage('3 mg * peso', { peso: 10, talla: 120 });

    expect(creatininaResult.dosisFinal).toBe(42);
    expect(legacyResult.dosisFinal).toBe(30);
  });
});

describe('runRuleEngine', () => {
  it('regla que no matchea -> array vacío', () => {
    const rules = [
      {
        id: 'r-no-match',
        conditions: {
          operator: 'AND',
          conditions: [{ field: 'edad', type: 'number', operator: '>', value: 18 }],
        },
      },
    ];

    const result = runRuleEngine({ rules, patientData: { edad: 10, nivelResolutivo: 'I-2' } });
    expect(result).toEqual([]);
  });

  it('rule con levelRequired [I-3] y facility I-1 -> array vacío', () => {
    const rules = [
      {
        id: 'r-level',
        levelRequired: ['I-3'],
        conditions: {
          operator: 'AND',
          conditions: [{ field: 'edad', type: 'number', operator: '>', value: 1 }],
        },
      },
    ];

    const result = runRuleEngine({ rules, patientData: { edad: 10, nivelResolutivo: 'I-1' } });
    expect(result).toEqual([]);
  });

  it('regla que matchea -> devuelve diagnosis, severity y treatmentPlan', () => {
    const rules = [
      {
        id: 'r-ok',
        conditions: {
          operator: 'AND',
          conditions: [{ field: 'edad', type: 'number', operator: '>', value: 1 }],
        },
        result: { classification: 'Deshidratación leve', severity: 'Leve' },
        treatment: { firstLine: 'SRO', doseFormula: '3 mg * peso' },
      },
    ];

    const result = runRuleEngine({
      rules,
      patientData: {
        edad: 10,
        peso: 20,
        nivelResolutivo: 'I-2',
        medicamentosDisponibles: ['SRO'],
      },
    });

    expect(result).toHaveLength(1);
    expect(result[0].diagnosis).toBe('Deshidratación leve');
    expect(result[0].severity).toBe('Leve');
    expect(result[0].treatmentPlan).toBeTruthy();
  });

  it('unmetPolicy exclude con medicamento faltante -> array vacío', () => {
    const rules = [
      {
        id: 'r-exclude',
        conditions: {
          operator: 'AND',
          conditions: [{ field: 'edad', type: 'number', operator: '>', value: 1 }],
        },
        requiredMedications: ['Sulfato ferroso'],
        treatment: { firstLine: 'Sulfato ferroso', doseFormula: '3 mg * peso' },
        result: { classification: 'Anemia', severity: 'Moderada' },
      },
    ];

    const result = runRuleEngine({
      rules,
      patientData: {
        edad: 12,
        peso: 20,
        nivelResolutivo: 'I-2',
        medicamentosDisponibles: [],
      },
      unmetPolicy: 'exclude',
    });

    expect(result).toEqual([]);
  });
});
