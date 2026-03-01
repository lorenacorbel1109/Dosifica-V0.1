import React from 'react';

/**
 * Tarjeta de estado reusable para KPIs del dashboard.
 */
const StatusCard = ({ title, value, subtitle }) => {
  return (
    <article
      style={{
        border: '1px solid #ddd',
        borderRadius: 8,
        padding: 12,
        background: '#fff',
      }}
    >
      <div style={{ fontSize: 13, color: '#666' }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 700, margin: '6px 0' }}>{value}</div>
      {subtitle ? <div style={{ fontSize: 12, color: '#888' }}>{subtitle}</div> : null}
    </article>
  );
};

export default StatusCard;
