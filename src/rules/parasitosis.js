export const parasitosisRules = [
  {
    id: 'parasitosis_intestinal_probable',
    pathology: 'parasitosis',
    conditions: [
      { field: 'sintomas', operator: 'includes', value: 'dolor abdominal' },
      { field: 'sintomas', operator: 'includes', value: 'prurito anal' },
    ],
    diagnosis: 'Parasitosis intestinal probable',
    severity: 'No complicada',
    treatment: {
      firstLine: 'Albendazol',
      alternative: 'Mebendazol',
      doseFormula: '400 mg',
      indications: ['Dosis única y control clínico.'],
    },
    referralCriteria: 'Referir si hay desnutrición severa, vómitos persistentes o sangrado digestivo.',
  },
];
