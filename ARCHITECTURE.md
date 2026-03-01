# Arquitectura Técnica

## 1. Rule Engine

Motor responsable de:
- Recibir datos del paciente
- Evaluar reglas
- Retornar diagnósticos aplicables

No contiene reglas clínicas.

---

## 2. Rule Evaluator

Evalúa condiciones:

Operadores soportados:
- equals
- greaterThan
- lessThan
- includes
- notIncludes

Debe permitir múltiples condiciones AND.

---

## 3. Dosage Calculator

Recibe:
- Fórmula
- Peso
- Edad

Evalúa expresiones seguras del tipo:

"75 * peso"
"10 * peso / 2"

Debe evitar ejecución arbitraria.

---

## 4. Rule Schema

Cada regla debe seguir este formato:

{
  id: string,
  pathology: string,
  levelRequired: ["I-1","I-2","I-3","I-4"],
  conditions: [
    {
      field: string,
      operator: string,
      value: any
    }
  ],
  diagnosis: string,
  severity: string,
  treatment: {
    firstLine: string,
    alternative: string,
    doseFormula: string
  },
  requiredMedications: [string],
  referralCriteria: string
}

---

## 5. Inventario

Estructura:

{
  medicationsAvailable: [],
  equipmentAvailable: [],
  establishmentLevel: "I-2"
}

---

## 6. Flujo de Evaluación

1. Filtrar reglas por patología
2. Filtrar por nivel resolutivo
3. Evaluar condiciones
4. Verificar disponibilidad de medicamentos
5. Calcular dosis
6. Retornar objeto final estructurado
