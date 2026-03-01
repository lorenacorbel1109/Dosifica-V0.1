import { useState } from 'react';
import styles from './Card.module.css';

/**
 * Contenedor visual reutilizable para secciones clínicas.
 */
const Card = ({ title, children, actions, variant = 'default', collapsible = false, compact = false }) => {
  const [collapsed, setCollapsed] = useState(false);
  const variantClass = {
    default: styles.variantDefault,
    critical: styles.variantCritical,
    warning: styles.variantWarning,
    mild: styles.variantMild,
    referral: styles.variantReferral,
  }[variant] || styles.variantDefault;

  return (
    <section className={`${styles.card} ${variantClass}`}>
      {(title || actions) && (
        <header className={styles.header}>
          <span>{title}</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {actions}
            {collapsible && (
              <button type="button" className={styles.toggle} onClick={() => setCollapsed((prev) => !prev)}>
                {collapsed ? '▾' : '▴'}
              </button>
            )}
          </div>
        </header>
      )}
      {!collapsed && <div className={`${styles.body} ${compact ? styles.compactBody : ''}`}>{children}</div>}
    </section>
  );
};

export default Card;
