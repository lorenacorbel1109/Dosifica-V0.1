import styles from './SeverityBadge.module.css';

const getSeverityMeta = (severity = '') => {
  const value = severity.toLowerCase();
  if (value.includes('leve')) return { tone: styles.leve, icon: '🟢' };
  if (value.includes('moder')) return { tone: styles.moderada, icon: '🟡' };
  if (value.includes('sever') || value.includes('grave')) return { tone: styles.severa, icon: '🔴' };
  if (value.includes('crít') || value.includes('critic')) return { tone: styles.critica, icon: '🚨' };
  return { tone: styles.default, icon: 'ℹ️' };
};

const SeverityBadge = ({ severity }) => {
  const meta = getSeverityMeta(severity);
  return (
    <span className={`${styles.badge} ${meta.tone}`}>
      <span aria-hidden="true">{meta.icon}</span>
      <span>{severity || 'No definida'}</span>
    </span>
  );
};

export default SeverityBadge;
