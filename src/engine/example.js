import { runRuleEngine } from './ruleEngine.js';
import { deshidratacionRules } from '../rules/deshidratacion.js';

const patientData = {
  edad: 28,
  peso: 62,
  sexo: 'F',
  sintomas: ['sed intensa', 'fatiga'],
  signos: ['ojos hundidos', 'mucosas secas'],
  laboratorio: {
    sodio: 138,
  },
  nivelResolutivo: 'I-2',
  medicamentosDisponibles: ['ClNa 0.9%'], // SRO no disponible, se usa alternativa
  equiposDisponibles: ['venoclisis'],
};

const results = runRuleEngine({
  rules: deshidratacionRules,
  patientData,
});

console.log(JSON.stringify(results, null, 2));
