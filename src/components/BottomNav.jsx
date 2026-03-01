import React from 'react';
import { useState } from 'react';
import { NAV_ITEMS } from './Sidebar.jsx';

const PRIMARY_ITEMS = [
  { id: 'evaluacion', label: 'Evaluar', icon: '🩺' },
  { id: 'reglas', label: 'Reglas', icon: '📘' },
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'inventario', label: 'Inventario', icon: '💊' },
  { id: 'more', label: 'Más', icon: '⋯' },
];

const BottomNav = ({ activeSection, onSelectSection }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const remainingItems = NAV_ITEMS.filter(
    (item) => !PRIMARY_ITEMS.some((primary) => primary.id === item.id && item.id !== 'more'),
  );

  return (
    <>
      {PRIMARY_ITEMS.map((item) => {
        const isActive = activeSection === item.id;

        return (
          <button
            key={item.id}
            type="button"
            className="touch-friendly"
            onClick={() => {
              if (item.id === 'more') {
                setDrawerOpen((prev) => !prev);
                return;
              }
              onSelectSection(item.id);
              setDrawerOpen(false);
            }}
            style={{
              minWidth: 64,
              minHeight: 'var(--touch-target)',
              border: 'none',
              background: 'transparent',
              color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              display: 'grid',
              justifyItems: 'center',
              alignContent: 'center',
              gap: 2,
              position: 'relative',
              fontWeight: isActive ? 700 : 500,
            }}
          >
            {isActive && item.id !== 'more' && (
              <span
                style={{
                  position: 'absolute',
                  top: -2,
                  width: 22,
                  height: 3,
                  borderRadius: 999,
                  background: 'var(--color-primary)',
                }}
              />
            )}
            <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span>
            <span style={{ fontSize: 12 }}>{item.label}</span>
          </button>
        );
      })}

      {drawerOpen && (
        <section
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom))',
            background: 'var(--color-surface)',
            borderTop: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-lg)',
            borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
            padding: 'var(--space-3)',
            display: 'grid',
            gap: 'var(--space-2)',
            zIndex: 30,
          }}
        >
          {remainingItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className="touch-friendly"
              onClick={() => {
                onSelectSection(item.id);
                setDrawerOpen(false);
              }}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                background: '#fff',
                padding: '10px 12px',
                textAlign: 'left',
                fontWeight: 600,
              }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </section>
      )}
    </>
  );
};

export default BottomNav;
