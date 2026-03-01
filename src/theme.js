/**
 * Sistema de diseño centralizado para Dosifica.
 * Mantiene compatibilidad con el shape histórico de `theme.colors` y `theme.levels`.
 */
export const tokens = {
  colors: {
    primary: '#1a56db',
    primaryDark: '#1240ab',
    primaryLight: '#ebf0ff',
    primarySurface: '#f0f5ff',

    critical: '#dc2626',
    criticalBg: '#fef2f2',
    warning: '#d97706',
    warningBg: '#fffbeb',
    mild: '#059669',
    mildBg: '#ecfdf5',
    info: '#0284c7',
    infoBg: '#f0f9ff',
    referral: '#7c3aed',
    referralBg: '#f5f3ff',

    background: '#f8fafc',
    surface: '#ffffff',
    border: '#e2e8f0',
    borderStrong: '#cbd5e1',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    sidebarBg: '#0f172a',
    sidebarText: '#e2e8f0',
    sidebarActive: '#1a56db',

    // aliases de compatibilidad
    success: '#059669',
    danger: '#dc2626',
    inactive: '#94a3b8',
  },
  typography: {
    fontSans: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontMono: "'JetBrains Mono', 'Fira Code', monospace",
    sizeXs: '0.75rem',
    sizeSm: '0.875rem',
    sizeBase: '1rem',
    sizeLg: '1.125rem',
    sizeXl: '1.25rem',
    size2Xl: '1.5rem',
    size3Xl: '1.875rem',
  },
  spacing: {
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
  },
  radius: {
    sm: '6px',
    md: '10px',
    lg: '14px',
    xl: '20px',
    full: '9999px',
  },
  shadow: {
    sm: '0 1px 3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.06)',
    md: '0 4px 6px rgba(15,23,42,0.07), 0 2px 4px rgba(15,23,42,0.06)',
    lg: '0 10px 15px rgba(15,23,42,0.08), 0 4px 6px rgba(15,23,42,0.05)',
    card: '0 1px 3px rgba(15,23,42,0.1)',
  },
  motion: {
    fast: '120ms ease',
    base: '200ms ease',
  },
  touch: {
    target: '44px',
    targetSm: '36px',
  },
  layout: {
    sidebarWidth: '240px',
    topbarHeight: '56px',
    bottomNavHeight: '60px',
  },
  levels: ['I-1', 'I-2', 'I-3', 'I-4'],
};

const theme = {
  colors: tokens.colors,
  levels: tokens.levels,
  typography: tokens.typography,
  spacing: tokens.spacing,
  radius: tokens.radius,
  shadow: tokens.shadow,
  motion: tokens.motion,
  touch: tokens.touch,
  layout: tokens.layout,
};

export default theme;
