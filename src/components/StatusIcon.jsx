import React from 'react';

/**
 * Icono clínico de referencia/hospitalización.
 */
const StatusIcon = ({ requiresReferral, requiresHospitalization }) => {
  if (requiresReferral) {
    return <span title="Referencia requerida">🚑</span>;
  }

  if (requiresHospitalization) {
    return <span title="Hospitalización requerida">🏥</span>;
  }

  return <span title="Manejo ambulatorio">✅</span>;
};

export default StatusIcon;
