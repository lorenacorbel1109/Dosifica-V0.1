import React from 'react';
import styles from './MainLayout.module.css';

/**
 * Layout principal tipo dashboard clínico (sidebar + topbar + contenido dinámico).
 */
const MainLayout = ({ sidebar, topbar, children, compactMode }) => {
  return (
    <div className={`${styles.appRoot} ${compactMode ? styles.compact : ''}`}>
      <div className={styles.layoutGrid}>
        {sidebar}
        <div className={styles.mainArea}>
          <div className={styles.topbar}>{topbar}</div>
          <main className={styles.content}>{children}</main>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
