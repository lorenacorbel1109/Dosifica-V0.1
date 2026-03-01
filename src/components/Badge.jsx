import styles from './Badge.module.css';

const Badge = ({ type = 'level', value = '', size = 'md' }) => {
  const normalized = String(value || '').toLowerCase();

  let tone = '';
  if (type === 'level') {
    if (normalized === 'i-1') tone = styles.levelI1;
    if (normalized === 'i-2') tone = styles.levelI2;
    if (normalized === 'i-3') tone = styles.levelI3;
    if (normalized === 'i-4') tone = styles.levelI4;
  }

  if (type === 'category') {
    if (normalized === 'emergencia') tone = styles.categoryEmergencia;
    if (normalized === 'consulta') tone = styles.categoryConsulta;
    if (normalized === 'programa') tone = styles.categoryPrograma;
  }

  return <span className={[styles.badge, styles[size] || styles.md, tone].join(' ')}>{value}</span>;
};

export default Badge;
