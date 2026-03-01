# Especificación de Reglas Clínicas

Las reglas deben ser:

- Determinísticas
- Claras
- No ambiguas
- Basadas en NTS vigente

---

## Campos Obligatorios

| Campo | Tipo | Descripción |
|-------|------|------------|
| id | string | Identificador único |
| pathology | string | Nombre de la patología |
| levelRequired | array | Nivel resolutivo mínimo |
| conditions | array | Condiciones clínicas |
| diagnosis | string | Diagnóstico |
| severity | string | Clasificación |
| treatment | object | Plan terapéutico |
| referralCriteria | string | Indicaciones de referencia |

---

## Ejemplo – Deshidratación Moderada Adulto

{
  id: "deshidratacion_moderada_adulto",
  pathology: "deshidratacion",
  levelRequired: ["I-1","I-2","I-3","I-4"],
  conditions: [
    { field: "edad", operator: "greaterThan", value: 15 },
    { field: "signos", operator: "includes", value: "ojos hundidos" }
  ],
  diagnosis: "Deshidratación moderada",
  severity: "Moderada",
  treatment: {
    firstLine: "SRO",
    alternative: "ClNa 0.9%",
    doseFormula: "75 * peso"
  },
  requiredMedications: ["SRO"],
  referralCriteria: "Si no mejora en 4 horas"
}
