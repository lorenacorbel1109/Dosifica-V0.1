import { useMemo, useState } from 'react';
import ClinicalVariableEditor from './ClinicalVariableEditor.jsx';
import ConditionGroupBuilder from './ConditionGroupBuilder.jsx';
import TreatmentLineEditor from './TreatmentLineEditor.jsx';
import { LEVEL_OPTIONS, SEVERITY_OPTIONS, createNewRule } from '../../types/ruleBuilderSchema.js';
import { PATHOLOGY_TEMPLATES } from '../../data/pathologyTemplates.js';

const STORAGE_KEY = 'clinical:rules:v2';

const normalizeRule = (rule) => {
  if (!rule) {
    return createNewRule();
  }

  return {
    ...createNewRule(),
    ...rule,
    levelRequired: Array.isArray(rule.levelRequired) ? rule.levelRequired : [],
    clinicalVariables: Array.isArray(rule.clinicalVariables) ? rule.clinicalVariables : [],
    treatmentLines: Array.isArray(rule.treatmentLines) ? rule.treatmentLines : [],
    conditions: rule.conditions || { operator: 'AND', conditions: [] },
    priority: Number.isFinite(Number(rule.priority)) ? Number(rule.priority) : 0,
    referralCriteria: rule.referralCriteria || '',
  };
};

const getStoredPathologies = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw || '[]');
    if (!Array.isArray(parsed)) return [];

    return Array.from(
      new Set(
        parsed
          .map((item) => (item?.pathology || '').trim())
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b)),
      ),
    );
  } catch {
    return [];
  }
};

const hasAnyCondition = (group) => {
  if (!group || !Array.isArray(group.conditions)) return false;

  return group.conditions.some((item) => {
    if (item && Array.isArray(item.conditions)) {
      return hasAnyCondition(item);
    }

    return Boolean(item && item.field && item.operator && item.value !== '');
  });
};

const conditionToText = (item) => {
  if (!item) return '';

  if (Array.isArray(item.conditions)) {
    const nested = item.conditions.map(conditionToText).filter(Boolean);
    if (!nested.length) return '';
    return `(${nested.join(` ${item.operator || 'AND'} `)})`;
  }

  const field = item.label || item.field || 'campo';
  const operator = item.operator || '=';
  const value = item.value ?? '';
  return `${field} ${operator} ${value}`.trim();
};

const conditionsToNaturalLanguage = (group) => {
  if (!group || !Array.isArray(group.conditions) || !group.conditions.length) {
    return 'Sin condiciones definidas';
  }

  const text = group.conditions.map(conditionToText).filter(Boolean).join(` ${group.operator || 'AND'} `);
  return text ? `SI ${text}` : 'Sin condiciones definidas';
};

const getSeverityBadgeStyle = (severity) => {
  const map = {
    Leve: { background: '#e8f5e9', color: '#1b5e20' },
    Moderada: { background: '#fff8e1', color: '#8a6d1f' },
    Severa: { background: '#fff3e0', color: '#8d3f12' },
    'Crítica': { background: '#ffebee', color: '#9c1c1c' },
  };

  return map[severity] || { background: '#e2e8f0', color: '#334155' };
};

const RuleBuilderForm = ({ initialRule, onSave, onCancel, nationalMedications }) => {
  const isNewRule = initialRule === null || initialRule === undefined;
  const [rule, setRule] = useState(() => normalizeRule(initialRule));
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(isNewRule);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const pathologyOptions = useMemo(getStoredPathologies, []);

  const setRuleField = (field, value) => {
    setRule((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleLevel = (level) => {
    setRule((prev) => {
      const current = Array.isArray(prev.levelRequired) ? prev.levelRequired : [];
      const next = current.includes(level) ? current.filter((item) => item !== level) : [...current, level];
      return { ...prev, levelRequired: next };
    });
  };

  const handleSave = () => {
    const nextErrors = [];

    if (!rule.name?.trim()) nextErrors.push('El nombre de la regla es obligatorio.');
    if (!rule.pathology?.trim()) nextErrors.push('La patología es obligatoria.');
    if (!rule.diagnosis?.trim()) nextErrors.push('El diagnóstico resultante es obligatorio.');
    if (!hasAnyCondition(rule.conditions)) nextErrors.push('Debe definir al menos una condición clínica.');
    if (!Array.isArray(rule.treatmentLines) || rule.treatmentLines.length === 0) {
      nextErrors.push('Debe registrar al menos una línea terapéutica.');
    }

    if (nextErrors.length) {
      setErrors(nextErrors);
      return;
    }

    const now = new Date().toISOString();
    const baseRule = initialRule ? { ...rule } : { ...createNewRule(), ...rule };
    const payload = {
      ...baseRule,
      updatedAt: now,
      createdAt: baseRule.createdAt || now,
      priority: Number(rule.priority) || 0,
    };

    setErrors([]);
    onSave(payload);
  };

  const severityBadge = getSeverityBadgeStyle(rule.severity);

  const handleTemplateSelection = (templateValue) => {
    if (!templateValue) return;

    if (templateValue === '__ZERO__') {
      setRule(normalizeRule(null));
      setSelectedTemplate(null);
      setShowTemplateSelector(false);
      return;
    }

    const template = PATHOLOGY_TEMPLATES.find((item) => item.pathology === templateValue);
    if (!template) return;

    setRule((prev) => ({
      ...prev,
      pathology: template.pathology,
      clinicalVariables: template.suggestedVariables || [],
    }));
    setSelectedTemplate(template);
    setShowTemplateSelector(false);
  };

  return (
    <section style={{ display: 'grid', gap: 16 }}>
      {isNewRule && showTemplateSelector && (
        <section style={{ border: '1px solid #dbe2ef', borderRadius: 8, padding: 12, display: 'grid', gap: 8 }}>
          <h3 style={{ margin: 0 }}>Comenzar desde plantilla</h3>
          <label>
            Seleccionar plantilla de patología
            <select defaultValue="" onChange={(event) => handleTemplateSelection(event.target.value)} style={{ width: '100%' }}>
              <option value="" disabled>
                Elegir una opción...
              </option>
              <option value="__ZERO__">Crear desde cero</option>
              {PATHOLOGY_TEMPLATES.map((template) => (
                <option key={template.pathology} value={template.pathology}>
                  {template.label}
                </option>
              ))}
            </select>
          </label>
        </section>
      )}

      {isNewRule && selectedTemplate && (
        <section style={{ border: '1px solid #dbe2ef', borderRadius: 8, padding: 12, display: 'grid', gap: 8 }}>
          <div style={{ border: '1px solid #86efac', background: '#f0fdf4', borderRadius: 6, padding: 8 }}>
            Plantilla cargada: {selectedTemplate.label}. Puedes personalizar las variables y agregar las
            clasificaciones.
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {selectedTemplate.suggestedSeverities.map((severity) => (
              <span
                key={severity}
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: 999,
                  padding: '2px 8px',
                  fontSize: 12,
                  background: '#f8fafc',
                }}
              >
                {severity}
              </span>
            ))}
          </div>

          <small style={{ color: '#6b7280' }}>{selectedTemplate.ntsReference}</small>
        </section>
      )}

      <section style={{ border: '1px solid #dbe2ef', borderRadius: 8, padding: 12, display: 'grid', gap: 10 }}>
        <h3 style={{ margin: 0 }}>Sección 1: Identificación</h3>

        <label>
          Nombre de la regla
          <input
            type="text"
            value={rule.name || ''}
            onChange={(event) => setRuleField('name', event.target.value)}
            placeholder='ej: "Neumonía grave < 5 años"'
            style={{ width: '100%' }}
          />
        </label>

        <label>
          Patología
          <input
            type="text"
            list="pathology-options"
            value={rule.pathology || ''}
            onChange={(event) => setRuleField('pathology', event.target.value)}
            placeholder="Ej: neumonia"
            style={{ width: '100%' }}
          />
          <datalist id="pathology-options">
            {pathologyOptions.map((pathology) => (
              <option key={pathology} value={pathology} />
            ))}
          </datalist>
        </label>

        <fieldset style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 10 }}>
          <legend>Nivel resolutivo</legend>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {LEVEL_OPTIONS.map((level) => (
              <label key={level} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="checkbox"
                  checked={(rule.levelRequired || []).includes(level)}
                  onChange={() => toggleLevel(level)}
                />
                {level}
              </label>
            ))}
          </div>
        </fieldset>

        <label>
          Severidad
          <select
            value={rule.severity || ''}
            onChange={(event) => setRuleField('severity', event.target.value)}
            style={{ width: '100%' }}
          >
            <option value="">Seleccionar severidad</option>
            {SEVERITY_OPTIONS.map((severity) => (
              <option key={severity} value={severity}>
                {severity}
              </option>
            ))}
          </select>
        </label>

        <label>
          Diagnóstico / Clasificación resultante
          <input
            type="text"
            value={rule.diagnosis || ''}
            onChange={(event) => setRuleField('diagnosis', event.target.value)}
            style={{ width: '100%' }}
          />
        </label>

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={Boolean(rule.requiresHospitalization)}
            onChange={(event) => setRuleField('requiresHospitalization', event.target.checked)}
          />
          ¿Requiere hospitalización?
        </label>

        <label>
          Prioridad
          <input
            type="number"
            min={0}
            max={100}
            value={rule.priority ?? 0}
            onChange={(event) => setRuleField('priority', event.target.value)}
          />
        </label>
      </section>

      <section style={{ display: 'grid', gap: 8 }}>
        <h3 style={{ margin: 0 }}>Sección 2: Variables clínicas</h3>
        <ClinicalVariableEditor
          variables={rule.clinicalVariables || []}
          onChange={(nextVariables) => setRuleField('clinicalVariables', nextVariables)}
        />
      </section>

      <section style={{ display: 'grid', gap: 8 }}>
        <h3 style={{ margin: 0 }}>Sección 3: Condiciones (lógica clínica)</h3>
        <ConditionGroupBuilder
          group={rule.conditions || { operator: 'AND', conditions: [] }}
          clinicalVariables={rule.clinicalVariables || []}
          onChange={(nextGroup) => setRuleField('conditions', nextGroup || { operator: 'AND', conditions: [] })}
        />
      </section>

      <section style={{ display: 'grid', gap: 8 }}>
        <h3 style={{ margin: 0 }}>Sección 4: Plan terapéutico</h3>
        <TreatmentLineEditor
          treatmentLines={rule.treatmentLines || []}
          onChange={(nextLines) => setRuleField('treatmentLines', nextLines)}
          nationalMedications={nationalMedications || []}
        />
      </section>

      <section style={{ display: 'grid', gap: 8 }}>
        <h3 style={{ margin: 0 }}>Sección 5: Criterios de referencia</h3>
        <label>
          Criterios de referencia / derivación
          <textarea
            value={rule.referralCriteria || ''}
            onChange={(event) => setRuleField('referralCriteria', event.target.value)}
            rows={4}
            style={{ width: '100%' }}
          />
        </label>
      </section>

      <section style={{ display: 'grid', gap: 8 }}>
        <h3 style={{ margin: 0 }}>Sección 6: Vista previa</h3>
        <button type="button" onClick={() => setShowPreview((prev) => !prev)} style={{ justifySelf: 'start' }}>
          Ver resumen de la regla
        </button>

        {showPreview && (
          <div style={{ border: '1px solid #dbe2ef', borderRadius: 8, padding: 12, display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <strong>{rule.name || 'Sin nombre'}</strong>
              <span
                style={{
                  borderRadius: 999,
                  padding: '2px 8px',
                  fontSize: 12,
                  fontWeight: 600,
                  ...severityBadge,
                }}
              >
                {rule.severity || 'Sin severidad'}
              </span>
            </div>

            <div><strong>Patología:</strong> {rule.pathology || '—'}</div>
            <div><strong>Niveles:</strong> {(rule.levelRequired || []).join(', ') || '—'}</div>
            <div><strong>Diagnóstico:</strong> {rule.diagnosis || '—'}</div>
            <div><strong>Condiciones:</strong> {conditionsToNaturalLanguage(rule.conditions)}</div>

            <div>
              <strong>Primera línea:</strong>
              <ul style={{ marginTop: 6 }}>
                {(rule.treatmentLines || [])
                  .filter((line) => Number(line.order) === 1)
                  .map((line, index) => {
                    const mg = Number(line?.dose?.mgPorKg);
                    const dosePreview = Number.isNaN(mg) ? '—' : `${mg * 10} ${line?.dose?.unit || 'mg'}`;
                    return (
                      <li key={`${line.medicationId || line.medicationName || 'med'}-${index}`}>
                        {line.medicationName || 'Sin fármaco'} · Dosis estimada 10kg: {dosePreview}
                      </li>
                    );
                  })}
                {(rule.treatmentLines || []).filter((line) => Number(line.order) === 1).length === 0 && (
                  <li>Sin primera línea definida</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </section>

      <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <button type="button" onClick={onCancel}>
          Cancelar
        </button>

        <div style={{ display: 'grid', gap: 8, justifyItems: 'end' }}>
          {errors.length > 0 && (
            <div
              style={{
                border: '1px solid #fecaca',
                background: '#fff1f2',
                color: '#9f1239',
                borderRadius: 6,
                padding: 10,
                minWidth: 320,
              }}
            >
              <strong>Corrige los siguientes errores:</strong>
              <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <button type="button" onClick={handleSave} style={{ fontWeight: 700 }}>
            Guardar regla
          </button>
        </div>
      </section>
    </section>
  );
};

export default RuleBuilderForm;
