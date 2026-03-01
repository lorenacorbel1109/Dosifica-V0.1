import React from 'react';
import theme from '../theme.js';

const getLevelColor = (level) => {
  if (level === 'I-1') return theme.colors.inactive;
  if (level === 'I-2') return theme.colors.info;
  if (level === 'I-3') return theme.colors.warning;
  return theme.colors.danger;
};

const LevelBadge = ({ level }) => (
  <span
    style={{
      border: `1px solid ${getLevelColor(level)}66`,
      color: getLevelColor(level),
      borderRadius: 6,
      padding: '1px 7px',
      fontSize: 12,
      fontWeight: 700,
    }}
  >
    {level || 'N/A'}
  </span>
);

export default LevelBadge;
