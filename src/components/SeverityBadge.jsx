import React from 'react';
import theme from '../theme.js';

const getColor = (severity = '') => {
  const value = severity.toLowerCase();
  if (value.includes('leve')) return theme.colors.success;
  if (value.includes('moder')) return theme.colors.warning;
  if (value.includes('sever') || value.includes('grave')) return theme.colors.danger;
  return theme.colors.info;
};

const SeverityBadge = ({ severity }) => (
  <span
    style={{
      background: `${getColor(severity)}22`,
      color: getColor(severity),
      border: `1px solid ${getColor(severity)}55`,
      borderRadius: 999,
      padding: '2px 8px',
      fontSize: 12,
      fontWeight: 700,
    }}
  >
    {severity || 'No definida'}
  </span>
);

export default SeverityBadge;
