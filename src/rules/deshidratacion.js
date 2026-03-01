/**
 * Reglas clínicas para deshidratación basadas en Planes A, B y C (OMS),
 * adaptadas al flujo de atención primaria NTS Perú.
 */
export const deshidratacionRules = [
  {
    id: 'desh_plan_a',
    pathology: 'deshidratacion',
    levelRequired: ['I-1', 'I-2', 'I-3', 'I-4'],
    conditions: [
      { field: 'signos', operator: 'notIncludes', value: 'ojos hundidos' },
      { field: 'signos', operator: 'notIncludes', value: 'mucosas secas' },
      { field: 'signos', operator: 'notIncludes', value: 'llenado capilar lento' },
      { field: 'signos', operator: 'notIncludes', value: 'letargo' },
    ],
    diagnosis: 'Sin deshidratación - Plan A domiciliario',
    severity: 'Leve',
    treatment: {
      firstLine: 'SRO',
      alternative: 'Líquidos caseros seguros',
      doseFormula: '10 ml * peso',
    },
    requiredMedications: ['SRO'],
    referralCriteria: 'Reevaluar y referir si aparecen signos de alarma o mala tolerancia oral.',
    requiresHospitalization: false,
  },
  {
    id: 'desh_plan_b',
    pathology: 'deshidratacion',
    levelRequired: ['I-2', 'I-3', 'I-4'],
    conditions: [
      { field: 'signos', operator: 'includes', value: 'ojos hundidos' },
      { field: 'signos', operator: 'includes', value: 'mucosas secas' },
      { field: 'signos', operator: 'includes', value: 'sed intensa' },
      { field: 'signos', operator: 'notIncludes', value: 'letargo' },
      { field: 'signos', operator: 'notIncludes', value: 'hipotensión' },
      { field: 'signos', operator: 'notIncludes', value: 'llenado capilar lento' },
    ],
    diagnosis: 'Deshidratación leve-moderada - Plan B supervisado',
    severity: 'Moderada',
    treatment: {
      firstLine: 'SRO',
      alternative: 'SRO fraccionada por cucharaditas',
      doseFormula: '75 ml * peso',
    },
    requiredMedications: ['SRO'],
    referralCriteria: 'Referir si no mejora en 4 horas, vómitos persistentes o deterioro clínico.',
    requiresHospitalization: false,
  },
  {
    id: 'desh_plan_c',
    pathology: 'deshidratacion',
    levelRequired: ['I-3', 'I-4'],
    conditions: [
      { field: 'signos', operator: 'includes', value: 'letargo' },
      { field: 'signos', operator: 'includes', value: 'hipotensión' },
      { field: 'signos', operator: 'includes', value: 'llenado capilar lento' },
    ],
    diagnosis: 'Deshidratación severa - Plan C hospitalario',
    severity: 'Severa',
    treatment: {
      firstLine: 'Solución salina 0.9% IV',
      alternative: 'Lactato de Ringer IV',
      doseFormula: '100 ml * peso',
    },
    requiredMedications: ['Solución salina 0.9% IV'],
    referralCriteria: 'Referir de inmediato si nivel I-1 o I-2',
    requiresHospitalization: true,
  },
];
