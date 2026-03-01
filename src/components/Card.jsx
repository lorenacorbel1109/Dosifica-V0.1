import React from 'react';
import styles from './MainLayout.module.css';

/**
 * Contenedor visual reutilizable para secciones clínicas.
 */
const Card = ({ title, children, actions }) => {
  return (
    <section className={styles.card}>
      {(title || actions) && (
        <header className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <span>{title}</span>
          {actions}
        </header>
      )}
      <div className={styles.cardBody}>{children}</div>
    </section>
  );
};

export default Card;
