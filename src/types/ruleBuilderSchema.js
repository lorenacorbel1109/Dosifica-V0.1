export const DEFAULT_RULE_TEMPLATE = {
  id: '', // se genera automático con crypto.randomUUID()
  name: '', // nombre del editor, ej: "Neumonía grave pediátrica"
  pathology: '', // nombre de la patología, ej: "neumonia"
  active: true,
  ntsVersion: 'NTS-2024',
  levelRequired: [], // array de strings: "I-1", "I-2", "I-3", "I-4"
  requiresHospitalization: false,
  priority: 0,

  // Variables clínicas usadas en esta regla (para mostrar en el formulario del evaluador)
  clinicalVariables: [
    // { key: 'hemoglobina', label: 'Hemoglobina (g/dL)', type: 'number', path: 'laboratorio.hemoglobina' }
    // { key: 'temperatura', label: 'Temperatura (°C)', type: 'number', path: 'signos_vitales.temperatura' }
    // { key: 'edad', label: 'Edad (años)', type: 'number', path: 'edad' }
    // { key: 'sexo', label: 'Sexo', type: 'select', options: ['M','F'], path: 'sexo' }
    // { key: 'signos', label: 'Signos clínicos', type: 'multiselect', path: 'signos' }
  ],

  // Condiciones en formato ConditionGroup (compatible con ruleEvaluator existente)
  conditions: {
    operator: 'AND',
    conditions: [],
    // Cada condición: { field: string, operator: string, value: any, type: 'number'|'string'|'boolean', label: string }
  },

  // Resultado clínico
  diagnosis: '',
  severity: '', // 'Leve' | 'Moderada' | 'Severa' | 'Crítica'

  // Plan terapéutico con múltiples fármacos (array, no solo firstLine/alternative)
  treatmentLines: [
    // {
    //   order: 1,                 // 1 = primera línea, 2 = alternativa
    //   medicationId: '',         // id del medicamento del listado nacional
    //   medicationName: '',       // nombre para mostrar
    //   dose: {
    //     mgPorKg: null,
    //     frecuencia: '',
    //     dosisMaxima: null,
    //     unit: 'mg',
    //     formula: '',            // opcional, expresión como "peso * mgPorKg"
    //   },
    //   indications: [],
    //   notes: ''
    // }
  ],

  referralCriteria: '',
  createdAt: '',
  updatedAt: '',
};

export const SEVERITY_OPTIONS = ['Leve', 'Moderada', 'Severa', 'Crítica'];

export const LEVEL_OPTIONS = ['I-1', 'I-2', 'I-3', 'I-4', 'II-1', 'II-2'];

export const OPERATOR_OPTIONS = [
  { value: '<', label: 'menor que' },
  { value: '>', label: 'mayor que' },
  { value: '<=', label: 'menor o igual que' },
  { value: '>=', label: 'mayor o igual que' },
  { value: '=', label: 'igual a' },
  { value: '!=', label: 'distinto de' },
  { value: 'includes', label: 'incluye' },
  { value: 'notIncludes', label: 'no incluye' },
];

export const createEmptyCondition = () => ({
  id: crypto.randomUUID(),
  field: '',
  operator: '>',
  value: '',
  type: 'number',
  label: '',
});

export const createEmptyGroup = (operator = 'AND') => ({
  id: crypto.randomUUID(),
  operator,
  conditions: [],
});

export const createNewRule = () => ({
  ...DEFAULT_RULE_TEMPLATE,
  id: crypto.randomUUID(),
  createdAt: new Date().toISOString(),
});
