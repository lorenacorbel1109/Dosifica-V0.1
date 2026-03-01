import { useMemo, useRef, useState } from 'react';
import RuleList from './RuleList.jsx';
import AutoCompleteInput from './AutoCompleteInput.jsx';
import Card from './Card.jsx';
import RuleBuilderForm from './ruleBuilder/RuleBuilderForm.jsx';
import { useClinicalStore } from '../store/clinicalStore.jsx';
import { useVariablesStore } from '../store/variablesStore.jsx';
import { useNationalMedicationsStore } from '../store/nationalMedicationsStore.jsx';

const MEDICATION_SUGGESTIONS = ['SRO', 'ClNa 0.9%', 'Sulfato ferroso', 'Hierro polimaltosado', 'Albendazol'];

const buildCondition = (variable) => ({
  field: variable?.id || '',
  label: variable?.name || '',
  type: variable?.type || 'number',
  operator: '=',
  value: '',
  unit: variable?.unit || '',
});

const buildGroup = () => ({ operator: 'AND', conditions: [] });
const parseCsv = (text) => text.split(',').map((item) => item.trim()).filter(Boolean);
const isGroup = (node) => Boolean(node?.conditions && node?.operator);
const isVisualRule = (rule) => Array.isArray(rule?.clinicalVariables);

const createEmptyRule = () => ({
  id: '',
  pathologyId: '',
  name: '',
  description: '',
  priority: 0,
  conditions: { operator: 'AND', conditions: [] },
  result: { classification: '', severity: '', tags: [] },
  managementPlanId: '',
  managementPlan: { id: '', name: '', description: '' },
  specificMedications: [],
  levelRestriction: [],
  treatment: { firstLine: '', alternative: '', doseFormula: '', indications: [] },
  requiredMedications: [],
  referralCriteria: '',
});

const normalizeRuleForEditor = (rule) => ({
  ...createEmptyRule(),
  ...rule,
  pathologyId: rule.pathologyId || rule.pathology || '',
  result: {
    classification: rule.result?.classification || rule.diagnosis || '',
    severity: rule.result?.severity || rule.severity || '',
    tags: Array.isArray(rule.result?.tags) ? rule.result.tags : [],
  },
  managementPlan: {
    id: rule.managementPlan?.id || rule.managementPlanId || '',
    name: rule.managementPlan?.name || rule.managementPlanId || '',
    description: rule.managementPlan?.description || rule.managementDescription || '',
  },
  specificMedications: Array.isArray(rule.specificMedications)
    ? rule.specificMedications
    : Array.isArray(rule.requiredMedications)
      ? rule.requiredMedications
      : [],
  conditions: isGroup(rule.conditions)
    ? rule.conditions
    : { operator: 'AND', conditions: Array.isArray(rule.conditions) ? rule.conditions : [] },
  levelRestriction: Array.isArray(rule.levelRestriction)
    ? rule.levelRestriction
    : Array.isArray(rule.levelRequired)
      ? rule.levelRequired
      : rule.levelRequired
        ? [rule.levelRequired]
        : [],
});

const normalizeRuleForSave = (rule) => {
  const pathology = rule.pathologyId;
  const classification = rule.result.classification;
  const severity = rule.result.severity;
  const specificMedications = Array.isArray(rule.specificMedications) ? rule.specificMedications : [];

  return {
    ...rule,
    pathologyId: pathology,
    pathology,
    diagnosis: classification,
    severity,
    priority: Number(rule.priority || 0),
    levelRequired: rule.levelRestriction,
    requiredMedications: Array.isArray(rule.requiredMedications) ? rule.requiredMedications : [],
    specificMedications,
    managementPlanId: rule.managementPlan?.id || rule.managementPlanId || '',
    managementPlan: {
      id: rule.managementPlan?.id || rule.managementPlanId || '',
      name: rule.managementPlan?.name || rule.managementPlanId || '',
      description: rule.managementPlan?.description || '',
    },
    result: {
      classification,
      severity,
      tags: Array.isArray(rule.result.tags) ? rule.result.tags : [],
    },
  };
};

const validateGroup = (group) => {
  if (!group?.operator || !Array.isArray(group.conditions) || !group.conditions.length) {
    return 'Cada grupo debe tener operador y al menos una condición o subgrupo.';
  }

  for (const node of group.conditions) {
    if (isGroup(node)) {
      const nestedError = validateGroup(node);
      if (nestedError) return nestedError;
      continue;
    }

    if (!node.field || !node.operator || node.value === '') {
      return 'Todas las condiciones deben definir variable, operador y valor.';
    }
  }

  return '';
};

const RuleNodeBuilder = ({ node, onChange, onDelete, variables }) => {
  if (isGroup(node)) {
    return (
      <section style={{ border: '1px solid #dbe2ef', borderRadius: 8, padding: 10, display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <strong>Grupo</strong>
          <select value={node.operator} onChange={(e) => onChange({ ...node, operator: e.target.value })}>
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          </select>
          {onDelete && (
            <button type="button" onClick={onDelete}>
              Eliminar grupo
            </button>
          )}
        </div>

        {(node.conditions || []).map((child, index) => (
          <RuleNodeBuilder
            key={`node-${index}`}
            node={child}
            variables={variables}
            onChange={(nextChild) => {
              const nextChildren = [...node.conditions];
              nextChildren[index] = nextChild;
              onChange({ ...node, conditions: nextChildren });
            }}
            onDelete={() => {
              const nextChildren = node.conditions.filter((_, childIndex) => childIndex !== index);
              onChange({ ...node, conditions: nextChildren });
            }}
          />
        ))}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => onChange({ ...node, conditions: [...node.conditions, buildCondition(variables[0])] })}
          >
            Agregar condición
          </button>
          <button type="button" onClick={() => onChange({ ...node, conditions: [...node.conditions, buildGroup()] })}>
            Agregar grupo
          </button>
        </div>
      </section>
    );
  }

  const selectedVariable = variables.find((item) => item.id === node.field);

  return (
    <section style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 8, display: 'grid', gap: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr 1fr auto', gap: 8, alignItems: 'center' }}>
        <AutoCompleteInput
          listId="variables-catalog"
          suggestions={variables.map((item) => `${item.id} - ${item.name}`)}
          value={node.field}
          onChange={(value) => {
            const exact = variables.find((item) => item.id === value || `${item.id} - ${item.name}` === value);
            if (!exact) {
              onChange({ ...node, field: value });
              return;
            }

            onChange({
              ...node,
              field: exact.id,
              label: exact.name,
              type: exact.type,
              unit: exact.unit || '',
              value: exact.type === 'boolean' ? false : '',
            });
          }}
          placeholder="Variable clínica"
        />

        <select value={node.operator} onChange={(e) => onChange({ ...node, operator: e.target.value })}>
          <option value=">">&gt;</option>
          <option value="<">&lt;</option>
          <option value=">=">&gt;=</option>
          <option value="<=">&lt;=</option>
          <option value="=">=</option>
          <option value="!=">!=</option>
          <option value="includes">includes</option>
          <option value="notIncludes">notIncludes</option>
        </select>

        {selectedVariable?.type === 'boolean' ? (
          <select value={String(node.value)} onChange={(e) => onChange({ ...node, value: e.target.value === 'true' })}>
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        ) : selectedVariable?.type === 'select' ? (
          <select value={String(node.value)} onChange={(e) => onChange({ ...node, value: e.target.value })}>
            <option value="">Seleccionar</option>
            {(selectedVariable.options || []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <input value={node.value} onChange={(e) => onChange({ ...node, value: e.target.value })} placeholder="Valor" />
        )}

        <button type="button" onClick={onDelete}>
          Eliminar
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 8 }}>
        <input value={node.label || ''} onChange={(e) => onChange({ ...node, label: e.target.value })} placeholder="Etiqueta visible" />
        <input value={node.unit || ''} onChange={(e) => onChange({ ...node, unit: e.target.value })} placeholder="Unidad" />
      </div>
    </section>
  );
};

const RuleEditor = ({ filterText = '' }) => {
  const {
    rules,
    addRule,
    updateRule,
    removeRule,
    addRuleFromBuilder,
    updateRuleFromBuilder,
    exportRulesToJSON,
    importRulesFromJSON,
  } = useClinicalStore();
  const { variables } = useVariablesStore();
  const { activeNationalMedications } = useNationalMedicationsStore();

  const [formRule, setFormRule] = useState(createEmptyRule());
  const [editingIndex, setEditingIndex] = useState(null);
  const [formError, setFormError] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle');
  const [viewMode, setViewMode] = useState('list');
  const [visualRuleId, setVisualRuleId] = useState(null);
  const [visualInitialRule, setVisualInitialRule] = useState(null);
  const [importMessage, setImportMessage] = useState('');
  const fileInputRef = useRef(null);

  const filteredRules = useMemo(() => {
    const query = filterText.trim().toLowerCase();
    if (!query) return rules;
    return rules.filter((rule) =>
      [rule.id, rule.pathologyId || rule.pathology, rule.result?.classification || rule.diagnosis, rule.name]
        .some((field) => String(field || '').toLowerCase().includes(query)),
    );
  }, [rules, filterText]);

  const validateRule = (rule) => {
    if (!rule.id.trim()) return 'ID de regla obligatorio.';
    if (!rule.pathologyId.trim()) return 'Patología obligatoria.';
    if (!(rule.result?.classification || '').trim()) return 'Clasificación obligatoria.';
    return validateGroup(rule.conditions);
  };

  const saveRule = () => {
    const error = validateRule(formRule);
    if (error) {
      setFormError(error);
      return;
    }

    const normalized = normalizeRuleForSave(formRule);
    if (editingIndex !== null) {
      updateRule(editingIndex, normalized);
    } else {
      addRule(normalized);
    }

    setFormRule(createEmptyRule());
    setEditingIndex(null);
    setFormError('');
    setSaveStatus('saved');
    setViewMode('list');
  };

  const openNewVisual = () => {
    setVisualInitialRule(null);
    setVisualRuleId(null);
    setFormError('');
    setSaveStatus('idle');
    setViewMode('visual');
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = importRulesFromJSON(text);
      if (result?.success) {
        setImportMessage(`Importación exitosa: ${result.count} reglas cargadas.`);
      } else {
        setImportMessage(result?.error || 'JSON inválido');
      }
    } catch {
      setImportMessage('JSON inválido');
    } finally {
      event.target.value = '';
    }
  };

  const renderRawEditor = () => (
    <section style={{ display: 'grid', gap: 12 }}>
      <Card title="Editor de reglas (modo código)">
        <section style={{ display: 'grid', gap: 10 }}>
          <label>ID<input value={formRule.id} onChange={(e) => setFormRule((prev) => ({ ...prev, id: e.target.value }))} /></label>
          <label>Patología<input value={formRule.pathologyId} onChange={(e) => setFormRule((prev) => ({ ...prev, pathologyId: e.target.value }))} /></label>
          <label>Nombre<input value={formRule.name} onChange={(e) => setFormRule((prev) => ({ ...prev, name: e.target.value }))} /></label>
          <label>Descripción<textarea rows={2} value={formRule.description} onChange={(e) => setFormRule((prev) => ({ ...prev, description: e.target.value }))} /></label>
          <label>Prioridad<input type="number" value={formRule.priority} onChange={(e) => setFormRule((prev) => ({ ...prev, priority: e.target.value }))} /></label>

          <h4 style={{ marginBottom: 0 }}>Condiciones (query builder)</h4>
          <RuleNodeBuilder node={formRule.conditions} onChange={(next) => setFormRule((prev) => ({ ...prev, conditions: next }))} variables={variables} />

          <h4 style={{ marginBottom: 0 }}>Resultado clasificatorio</h4>
          <label>Clasificación<input value={formRule.result.classification} onChange={(e) => setFormRule((prev) => ({ ...prev, result: { ...prev.result, classification: e.target.value } }))} /></label>
          <label>Severidad<input value={formRule.result.severity} onChange={(e) => setFormRule((prev) => ({ ...prev, result: { ...prev.result, severity: e.target.value } }))} /></label>
          <label>Tags (coma separadas)<input value={(formRule.result.tags || []).join(', ')} onChange={(e) => setFormRule((prev) => ({ ...prev, result: { ...prev.result, tags: parseCsv(e.target.value) } }))} /></label>

          <h4 style={{ marginBottom: 0 }}>Plan de manejo y medicación</h4>
          <label>ID plan manejo<input value={formRule.managementPlan.id} onChange={(e) => setFormRule((prev) => ({ ...prev, managementPlanId: e.target.value, managementPlan: { ...prev.managementPlan, id: e.target.value } }))} /></label>
          <label>Nombre plan manejo<input value={formRule.managementPlan.name} onChange={(e) => setFormRule((prev) => ({ ...prev, managementPlan: { ...prev.managementPlan, name: e.target.value } }))} /></label>
          <label>Descripción plan manejo<textarea rows={2} value={formRule.managementPlan.description} onChange={(e) => setFormRule((prev) => ({ ...prev, managementPlan: { ...prev.managementPlan, description: e.target.value } }))} /></label>
          <label>Medicamentos específicos (coma separados)<input value={(formRule.specificMedications || []).join(', ')} onChange={(e) => setFormRule((prev) => ({ ...prev, specificMedications: parseCsv(e.target.value) }))} /></label>

          <label>Medicamento de elección<AutoCompleteInput listId="med-first-line" suggestions={MEDICATION_SUGGESTIONS} value={formRule.treatment.firstLine} onChange={(value) => setFormRule((prev) => ({ ...prev, treatment: { ...prev.treatment, firstLine: value } }))} /></label>
          <label>Alternativa<AutoCompleteInput listId="med-alternative" suggestions={MEDICATION_SUGGESTIONS} value={formRule.treatment.alternative} onChange={(value) => setFormRule((prev) => ({ ...prev, treatment: { ...prev.treatment, alternative: value } }))} /></label>
          <label>Fórmula de dosis<input value={formRule.treatment.doseFormula} onChange={(e) => setFormRule((prev) => ({ ...prev, treatment: { ...prev.treatment, doseFormula: e.target.value } }))} /></label>

          <label>Restricción de nivel (coma separadas)
            <input value={formRule.levelRestriction.join(', ')} onChange={(e) => setFormRule((prev) => ({ ...prev, levelRestriction: parseCsv(e.target.value) }))} />
          </label>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={saveRule}>Guardar regla</button>
            <button type="button" onClick={() => { setViewMode('list'); setFormError(''); }}>
              Cancelar
            </button>
          </div>
        </section>
      </Card>
    </section>
  );

  return (
    <section style={{ display: 'grid', gap: 12 }}>
      {formError && <div style={{ border: '1px solid #e39', background: '#fff0f5', color: '#701', padding: 10, borderRadius: 8 }}>{formError}</div>}
      {saveStatus === 'saved' && <div style={{ border: '1px solid #86efac', background: '#f0fdf4', padding: 8, borderRadius: 8, fontSize: 12 }}>Regla guardada correctamente.</div>}
      {importMessage && (
        <div style={{ border: '1px solid #93c5fd', background: '#eff6ff', color: '#1e3a8a', padding: 8, borderRadius: 8 }}>
          {importMessage}
        </div>
      )}

      <Card title="Editor de reglas clínicas">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={openNewVisual}
            style={{
              border: 'none',
              borderRadius: 8,
              padding: '10px 14px',
              background: '#1f4f99',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            + Nueva regla clínica
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => exportRulesToJSON()}>⬇ Exportar reglas</button>
            <button type="button" onClick={handleImportClick}>⬆ Importar reglas</button>
            <input ref={fileInputRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={handleFileImport} />
          </div>
        </div>
      </Card>

      {viewMode === 'visual' && (
        <Card title="Rule Builder Visual">
          <RuleBuilderForm
            initialRule={visualInitialRule}
            nationalMedications={activeNationalMedications || []}
            onCancel={() => {
              setViewMode('list');
              setVisualRuleId(null);
              setVisualInitialRule(null);
            }}
            onSave={(savedRule) => {
              if (visualRuleId) {
                updateRuleFromBuilder(visualRuleId, savedRule);
              } else {
                addRuleFromBuilder(savedRule);
              }
              setSaveStatus('saved');
              setViewMode('list');
              setVisualRuleId(null);
              setVisualInitialRule(null);
            }}
          />
        </Card>
      )}

      {viewMode === 'raw' && renderRawEditor()}

      {viewMode === 'list' && (
        <RuleList
          rules={filteredRules}
          onEdit={(rule) => {
            const sourceIndex = rules.findIndex((item) => item.id === rule.id);
            if (sourceIndex < 0) return;

            if (isVisualRule(rules[sourceIndex])) {
              setVisualRuleId(rules[sourceIndex].id);
              setVisualInitialRule(rules[sourceIndex]);
              setViewMode('visual');
              return;
            }

            setFormRule(normalizeRuleForEditor(rules[sourceIndex]));
            setEditingIndex(sourceIndex);
            setSaveStatus('idle');
            setViewMode('raw');
          }}
          onDelete={(rule) => {
            const sourceIndex = rules.findIndex((item) => item.id === rule.id);
            if (sourceIndex < 0) return;
            removeRule(sourceIndex);
          }}
        />
      )}
    </section>
  );
};

export default RuleEditor;
