import React, { useMemo } from 'react';
import { useClinicalStore } from '../store/clinicalStore.jsx';
import { useEstablishmentsStore } from '../store/establishmentsStore.jsx';
import { useAppModeStore } from '../store/appModeStore.jsx';
import { useAuditStore } from '../store/auditStore.jsx';
import { useDecisionLogStore } from '../store/decisionLogStore.jsx';
import Card from './Card.jsx';
import SmartTable from './SmartTable.jsx';
import SeverityBadge from './SeverityBadge.jsx';
import LevelBadge from './LevelBadge.jsx';
import StatusIcon from './StatusIcon.jsx';

/**
 * Dashboard central de visualización del estado del sistema clínico.
 */
const SystemDashboard = ({ filterText = '' }) => {
  const { rules, evaluableRules, activeNtsVersion, versionSummary } = useClinicalStore();
  const { establishments, activeEstablishment } = useEstablishmentsStore();
  const { mode } = useAppModeStore();
  const { auditLogs } = useAuditStore();
  const { decisions } = useDecisionLogStore();

  const latestAudit20 = useMemo(() => auditLogs.slice(0, 20), [auditLogs]);
  const latestDecisions20 = useMemo(() => decisions.slice(0, 20), [decisions]);

  const ruleRows = useMemo(
    () =>
      rules.map((rule) => ({
        id: rule.id,
        pathology: rule.pathology,
        severity: rule.severity,
        levelRequired: Array.isArray(rule.levelRequired)
          ? rule.levelRequired.join(', ')
          : rule.levelRequired || '-',
        active: rule.active ? 'Activa' : 'Inactiva',
        ntsVersion: rule.ntsVersion || '-',
        requiresHospitalization: rule.requiresHospitalization,
      })),
    [rules],
  );

  const auditRows = useMemo(
    () =>
      latestAudit20.map((entry) => ({
        timestamp: entry.timestamp,
        diagnosis: entry.diagnosis,
        establishmentId: entry.establishmentId,
        medication: entry.medication,
        referral: entry.referral ? 'Sí' : 'No',
      })),
    [latestAudit20],
  );

  const decisionRows = useMemo(
    () =>
      latestDecisions20.map((item) => ({
        diagnosisSuggested: item.diagnosisSuggested,
        diagnosisFinal: item.diagnosisFinal,
        clinicianId: item.clinicianId || 'No autenticado',
        confirmedAt: item.confirmedAt,
      })),
    [latestDecisions20],
  );

  return (
    <section style={{ display: 'grid', gap: 12 }}>
      <Card title="🔹 Sección 1 – Estado del motor">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
          <div>Total reglas activas: <strong>{evaluableRules.length}</strong></div>
          <div>Versión NTS activa: <strong>{activeNtsVersion}</strong></div>
          <div>Modo del sistema: <strong>{mode}</strong></div>
          <div>Establecimiento activo: <strong>{activeEstablishment?.name || '-'}</strong></div>
          <div>Establecimientos registrados: <strong>{establishments.length}</strong></div>
          <div>Versiones NTS disponibles: <strong>{versionSummary.length}</strong></div>
        </div>
      </Card>

      <Card title="🔹 Sección 2 – Inventario">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 180px', gap: 10 }}>
          <div>
            <strong>Medicamentos disponibles</strong>
            <div style={{ fontSize: 13 }}>{activeEstablishment?.medicationsAvailable?.join(', ') || 'Sin registro'}</div>
          </div>
          <div>
            <strong>Equipos disponibles</strong>
            <div style={{ fontSize: 13 }}>{activeEstablishment?.equipmentAvailable?.join(', ') || 'Sin registro'}</div>
          </div>
          <div>
            <strong>Nivel resolutivo</strong>
            <div><LevelBadge level={activeEstablishment?.level} /></div>
          </div>
        </div>
      </Card>

      <Card title="🔹 Sección 3 – Reglas">
        <SmartTable
          filterText={filterText}
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'pathology', label: 'Patología' },
            { key: 'severity', label: 'Severidad', render: (value) => <SeverityBadge severity={value} /> },
            { key: 'levelRequired', label: 'Nivel requerido' },
            { key: 'active', label: 'Estado' },
            { key: 'ntsVersion', label: 'Versión NTS' },
            {
              key: 'requiresHospitalization',
              label: 'Estado clínico',
              render: (_, row) => (
                <StatusIcon
                  requiresReferral={false}
                  requiresHospitalization={Boolean(row.requiresHospitalization)}
                />
              ),
            },
          ]}
          rows={ruleRows}
          emptyMessage="Sin reglas para mostrar."
        />
      </Card>

      <Card title="🔹 Sección 4 – Auditoría (últimos 20)">
        <SmartTable
          filterText={filterText}
          columns={[
            { key: 'timestamp', label: 'Fecha' },
            { key: 'diagnosis', label: 'Diagnóstico' },
            { key: 'establishmentId', label: 'Establecimiento' },
            { key: 'medication', label: 'Medicamento' },
            {
              key: 'referral',
              label: 'Referencia',
              render: (value) => <StatusIcon requiresReferral={value === 'Sí'} requiresHospitalization={false} />,
            },
          ]}
          rows={auditRows}
          emptyMessage="Sin registros de auditoría."
        />
      </Card>

      <Card title="🔹 Sección 5 – Decisiones médicas (últimas 20)">
        <SmartTable
          filterText={filterText}
          columns={[
            { key: 'diagnosisSuggested', label: 'Diagnóstico sugerido' },
            { key: 'diagnosisFinal', label: 'Diagnóstico final' },
            { key: 'clinicianId', label: 'Confirmado por' },
            { key: 'confirmedAt', label: 'Fecha' },
          ]}
          rows={decisionRows}
          emptyMessage="Sin decisiones médicas confirmadas."
        />
      </Card>
    </section>
  );
};

export default SystemDashboard;
