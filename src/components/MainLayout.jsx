import React from 'react';
import styles from './MainLayout.module.css';
import { useMediaQuery } from '../hooks/useMediaQuery.js';

/**
 * Layout principal responsive (mobile-first) para flujo clínico.
 */
const MainLayout = ({ sidebar, topbar, bottomNav, children }) => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1024px)');

  const sidebarCollapsed = Boolean(sidebar?.props?.collapsed);
  const sidebarExpanded = !sidebarCollapsed;

  const sidebarNode = React.isValidElement(sidebar)
    ? React.cloneElement(sidebar, { isMobile, isTablet })
    : sidebar;

  const topbarNode = React.isValidElement(topbar)
    ? React.cloneElement(topbar, { isMobile, isTablet })
    : topbar;

  const bottomNavNode = React.isValidElement(bottomNav)
    ? React.cloneElement(bottomNav, { isMobile, isTablet })
    : bottomNav;

  return (
    <div className={styles.appRoot}>
      <div
        className={[
          styles.layoutGrid,
          sidebarExpanded ? styles.sidebarIsExpanded : '',
        ].join(' ')}
      >
        {!isMobile && (
          <aside className={[styles.sidebar, sidebarExpanded ? styles.sidebarExpanded : ''].join(' ')}>
            {sidebarNode}
          </aside>
        )}

        <div className={styles.mainArea}>
          <div className={styles.topbar}>{topbarNode}</div>
          <main className={styles.content} style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + ${isMobile ? 'var(--bottom-nav-height)' : '0px'})` }}>
            {children}
          </main>
        </div>
      </div>

      {isMobile && bottomNavNode && <nav className={styles.bottomNav}>{bottomNavNode}</nav>}
    </div>
  );
};

export default MainLayout;
