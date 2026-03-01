import { useMemo, useState } from 'react';
import styles from './ClinicalFlowchart.module.css';

const NODE = {
  width: 280,
  condW: 250,
  h: 72,
  vGap: 74,
};

const getPathologyName = (rules) => {
  const first = rules?.[0] || {};
  return first.pathology || first.pathologyId || 'Patología';
};

const getRuleSeverity = (rule) => rule?.severity || rule?.result?.severity || 'No definida';
const getRuleDiagnosis = (rule) => rule?.diagnosis || rule?.result?.classification || 'Diagnóstico no definido';

const getFirstTreatment = (rule) => {
  if (Array.isArray(rule?.treatmentLines) && rule.treatmentLines.length) {
    const first = [...rule.treatmentLines].sort((a, b) => (a.order || 0) - (b.order || 0))[0];
    return first?.medicationName || first?.medicationId || 'Tratamiento no definido';
  }

  if (rule?.treatment?.firstLine) return rule.treatment.firstLine;
  return rule?.treatmentPlan?.selectedTreatment || 'Tratamiento no definido';
};

const operatorLabel = (operator) => {
  const map = {
    '<': '<',
    '>': '>',
    '<=': '≤',
    '>=': '≥',
    '=': '=',
    '!=': '≠',
    includes: 'incluye',
    notIncludes: 'no incluye',
  };
  return map[operator] || operator || '=';
};

const collectFlatConditions = (conditionGroup) => {
  if (!conditionGroup) return [];
  const source = Array.isArray(conditionGroup.conditions)
    ? conditionGroup.conditions
    : Array.isArray(conditionGroup)
      ? conditionGroup
      : [];

  const output = [];
  source.forEach((item) => {
    if (item && Array.isArray(item.conditions)) {
      output.push(...collectFlatConditions(item));
      return;
    }
    if (item && item.field) output.push(item);
  });

  return output;
};

const severityColor = (severity = '') => {
  const value = severity.toLowerCase();
  if (value.includes('crít')) return { fill: '#f5f3ff', stroke: '#7c3aed' };
  if (value.includes('sever') || value.includes('grave')) return { fill: '#fef2f2', stroke: '#dc2626' };
  if (value.includes('moder')) return { fill: '#fffbeb', stroke: '#d97706' };
  if (value.includes('leve')) return { fill: '#ecfdf5', stroke: '#059669' };
  return { fill: '#f0f9ff', stroke: '#0284c7' };
};

const drawArrow = (fromX, fromY, toX, toY, elbow = false) => {
  if (!elbow) return `M ${fromX} ${fromY} L ${toX} ${toY}`;
  const midY = fromY + (toY - fromY) * 0.5;
  return `M ${fromX} ${fromY} L ${fromX} ${midY} L ${toX} ${midY} L ${toX} ${toY}`;
};

const ClinicalFlowchart = ({ rules = [], onSelectResult = () => {}, width = '100%', highlightedDiagnosis = '' }) => {
  const [selectedRule, setSelectedRule] = useState(null);

  const model = useMemo(() => {
    const pathologyName = getPathologyName(rules);

    const condMap = new Map();
    rules.forEach((rule) => {
      collectFlatConditions(rule.conditions).forEach((condition) => {
        const key = `${condition.field}|${condition.operator}|${String(condition.value)}`;
        if (!condMap.has(key)) {
          condMap.set(key, {
            id: `cond-${condMap.size + 1}`,
            label: condition.label || condition.field,
            operator: condition.operator,
            value: condition.value,
          });
        }
      });
    });

    const conditions = Array.from(condMap.values());

    const results = rules.map((rule, index) => ({
      id: `result-${index + 1}`,
      rule,
      diagnosis: getRuleDiagnosis(rule),
      severity: getRuleSeverity(rule),
      treatment: getFirstTreatment(rule),
      needsReferral: Boolean(rule?.requiresHospitalization),
    }));

    return { pathologyName, conditions, results };
  }, [rules]);

  if (!rules.length) {
    return <div className={styles.empty}>No hay reglas para dibujar el flujograma clínico.</div>;
  }

  const maxResultsPerRow = 2;
  const resultRows = Math.ceil(model.results.length / maxResultsPerRow);
  const svgWidth = Math.max(760, maxResultsPerRow * (NODE.width + 80));
  const topSectionHeight = 70 + model.conditions.length * NODE.vGap + 80;
  const resultsYStart = topSectionHeight;
  const svgHeight = resultsYStart + resultRows * 140 + 180;

  const centerX = svgWidth / 2;
  const startNode = { x: centerX - NODE.width / 2, y: 24, w: NODE.width, h: NODE.h };

  const conditionNodes = model.conditions.map((condition, index) => ({
    ...condition,
    x: centerX - NODE.condW / 2,
    y: 120 + index * NODE.vGap,
    w: NODE.condW,
    h: 64,
  }));

  const resultNodes = model.results.map((result, index) => {
    const row = Math.floor(index / maxResultsPerRow);
    const col = index % maxResultsPerRow;
    const sectionWidth = (svgWidth - 120) / maxResultsPerRow;
    const x = 60 + col * sectionWidth + (sectionWidth - NODE.width) / 2;
    const y = resultsYStart + row * 140;
    return { ...result, x, y, w: NODE.width, h: 92 };
  });

  const referNode = {
    x: centerX - 72,
    y: svgHeight - 120,
    w: 144,
    h: 72,
  };

  const lastConditionBottomY = conditionNodes.length
    ? conditionNodes[conditionNodes.length - 1].y + conditionNodes[conditionNodes.length - 1].h
    : startNode.y + startNode.h;

  return (
    <section className={styles.wrapper} style={{ width }}>
      <div className={styles.canvasScroll}>
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className={styles.svg} role="img" aria-label="Flujograma clínico">
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
              <path d="M0,0 L0,6 L9,3 z" fill="#64748b" />
            </marker>
          </defs>

          <path d={drawArrow(centerX, startNode.y + startNode.h, centerX, conditionNodes[0]?.y || resultsYStart)} stroke="#64748b" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />

          {conditionNodes.map((node, index) => {
            const fromY = node.y + node.h;
            const toY = conditionNodes[index + 1]?.y || resultsYStart;

            return (
              <g key={node.id}>
                <polygon
                  points={`${node.x + node.w / 2},${node.y} ${node.x + node.w},${node.y + node.h / 2} ${node.x + node.w / 2},${node.y + node.h} ${node.x},${node.y + node.h / 2}`}
                  fill="#fffbeb"
                  stroke="#d97706"
                  strokeWidth="2"
                />
                <text x={node.x + node.w / 2} y={node.y + node.h / 2 - 4} textAnchor="middle" fontSize="12" fill="#7c2d12">
                  {`¿${node.label} ${operatorLabel(node.operator)} ${String(node.value)}?`}
                </text>

                <path d={drawArrow(centerX, fromY, centerX, toY)} stroke="#64748b" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
                <text x={centerX + 8} y={(fromY + toY) / 2 - 4} fontSize="11" fill="#059669">Sí</text>
                <text x={centerX - 26} y={(fromY + toY) / 2 + 10} fontSize="11" fill="#dc2626">No</text>
              </g>
            );
          })}

          {resultNodes.map((node) => {
            const color = severityColor(node.severity);
            const isHighlighted = highlightedDiagnosis
              && node.diagnosis.toLowerCase() === highlightedDiagnosis.toLowerCase();
            return (
              <g key={node.id} className={isHighlighted ? styles.highlightNode : ''}>
                <path d={drawArrow(centerX, lastConditionBottomY, node.x + node.w / 2, node.y, true)} stroke="#64748b" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />

                <rect x={node.x} y={node.y} width={node.w} height={node.h} rx="12" fill={color.fill} stroke={isHighlighted ? '#1a56db' : color.stroke} strokeWidth={isHighlighted ? '3' : '2'} style={{ cursor: 'pointer' }} onClick={() => {
                  setSelectedRule(node.rule);
                  onSelectResult(node.rule);
                }} />
                <text x={node.x + 10} y={node.y + 20} fontSize="12" fill="#0f172a">
                  {node.diagnosis.slice(0, 40)}
                </text>
                <text x={node.x + 10} y={node.y + 38} fontSize="11" fill="#334155">
                  {`Severidad: ${node.severity}`}
                </text>
                <text x={node.x + 10} y={node.y + 56} fontSize="11" fill="#334155">
                  {`1ra línea: ${node.treatment.slice(0, 28)}`}
                </text>
              </g>
            );
          })}

          {resultNodes
            .filter((node) => node.needsReferral)
            .map((node) => (
              <path
                key={`ref-arrow-${node.id}`}
                d={drawArrow(node.x + node.w / 2, node.y + node.h, referNode.x + referNode.w / 2, referNode.y, true)}
                stroke="#dc2626"
                strokeWidth="2"
                fill="none"
                markerEnd="url(#arrow)"
              />
            ))}

          <rect x={startNode.x} y={startNode.y} width={startNode.w} height={startNode.h} rx="14" fill="#ebf0ff" stroke="#1a56db" strokeWidth="2" />
          <text x={centerX} y={startNode.y + 30} textAnchor="middle" fontSize="14" fontWeight="700" fill="#1a56db">
            {`Evaluar: ${model.pathologyName}`}
          </text>

          <polygon
            points={`${referNode.x + 30},${referNode.y} ${referNode.x + referNode.w - 30},${referNode.y} ${referNode.x + referNode.w},${referNode.y + 20} ${referNode.x + referNode.w},${referNode.y + referNode.h - 20} ${referNode.x + referNode.w - 30},${referNode.y + referNode.h} ${referNode.x + 30},${referNode.y + referNode.h} ${referNode.x},${referNode.y + referNode.h - 20} ${referNode.x},${referNode.y + 20}`}
            fill="#fee2e2"
            stroke="#dc2626"
            strokeWidth="2"
          />
          <text x={referNode.x + referNode.w / 2} y={referNode.y + referNode.h / 2 + 4} textAnchor="middle" fontSize="14" fontWeight="700" fill="#991b1b">
            REFERIR
          </text>
        </svg>
      </div>

      <div className={styles.meta}>
        Reglas: {model.results.length} · Condiciones únicas: {model.conditions.length}
      </div>

      {selectedRule && (
        <section className={styles.detailPanel}>
          <h4 className={styles.detailTitle}>{getRuleDiagnosis(selectedRule)}</h4>
          <p className={styles.detailText}><strong>Severidad:</strong> {getRuleSeverity(selectedRule)}</p>
          <p className={styles.detailText}><strong>Tratamiento primera línea:</strong> {getFirstTreatment(selectedRule)}</p>
          <p className={styles.detailText}><strong>Referencia:</strong> {selectedRule?.requiresHospitalization ? 'Requerida' : 'No requerida'}</p>
        </section>
      )}
    </section>
  );
};

export default ClinicalFlowchart;
