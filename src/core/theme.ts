/**
 * LandMapMagic Design Tokens
 * 
 * Inspired by shadcn/ui's design system - provides consistent styling
 * without requiring Tailwind CSS or any external CSS dependencies.
 * 
 * Usage:
 *   import { theme, cn } from '../core/theme.js';
 *   <div style={theme.card}>...</div>
 */

import type { CSSProperties } from 'react';

// ============================================================================
// COLOR PALETTE (shadcn-inspired)
// ============================================================================

export const colors = {
  // Background colors
  background: 'hsl(222.2, 84%, 4.9%)',       // --background (dark)
  foreground: 'hsl(210, 40%, 98%)',          // --foreground
  
  // Card colors
  card: 'hsl(222.2, 84%, 4.9%)',
  cardForeground: 'hsl(210, 40%, 98%)',
  
  // Popover colors (same as card for dark theme)
  popover: 'hsl(222.2, 84%, 4.9%)',
  popoverForeground: 'hsl(210, 40%, 98%)',
  
  // Primary (blue)
  primary: 'hsl(217.2, 91.2%, 59.8%)',       // #3b82f6
  primaryForeground: 'hsl(222.2, 47.4%, 11.2%)',
  primaryHover: 'hsl(217.2, 91.2%, 50%)',
  
  // Secondary
  secondary: 'hsl(217.2, 32.6%, 17.5%)',     // slate-800
  secondaryForeground: 'hsl(210, 40%, 98%)',
  secondaryHover: 'hsl(217.2, 32.6%, 22%)',
  
  // Muted
  muted: 'hsl(217.2, 32.6%, 17.5%)',
  mutedForeground: 'hsl(215, 20.2%, 65.1%)', // slate-400
  
  // Accent (purple/violet for CDL/special)
  accent: 'hsl(263.4, 70%, 50.4%)',          // violet-600
  accentForeground: 'hsl(210, 40%, 98%)',
  
  // Success (green for CDL)
  success: 'hsl(142.1, 76.2%, 36.3%)',       // green-600
  successForeground: 'hsl(355.7, 100%, 97.3%)',
  successMuted: 'hsl(142.1, 76.2%, 36.3%, 0.15)',
  
  // Destructive (red)
  destructive: 'hsl(0, 62.8%, 30.6%)',
  destructiveForeground: 'hsl(210, 40%, 98%)',
  
  // Border
  border: 'hsl(217.2, 32.6%, 17.5%)',
  borderLight: 'hsl(215, 20.2%, 25%)',
  
  // Input
  input: 'hsl(217.2, 32.6%, 17.5%)',
  
  // Ring (focus)
  ring: 'hsl(224.3, 76.3%, 48%)',
  
  // Specific UI colors
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
  },
  
  green: {
    50: '#f0fdf4',
    100: '#dcfce7',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
  },
  
  violet: {
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
  },
} as const;

// ============================================================================
// SPACING & SIZING
// ============================================================================

export const spacing = {
  0: '0',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  2.5: '10px',
  3: '12px',
  3.5: '14px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
} as const;

export const borderRadius = {
  none: '0',
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  full: '9999px',
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const fontSize = {
  xs: '11px',
  sm: '12px',
  base: '13px',
  md: '14px',
  lg: '16px',
  xl: '18px',
} as const;

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const fontFamily = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  mono: 'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  popover: '0 4px 12px rgba(0, 0, 0, 0.3)',
} as const;

// ============================================================================
// TRANSITIONS
// ============================================================================

export const transitions = {
  fast: 'all 0.1s ease',
  default: 'all 0.15s ease',
  slow: 'all 0.3s ease',
} as const;

// ============================================================================
// PRE-BUILT COMPONENT STYLES (shadcn-inspired)
// ============================================================================

export const theme = {
  // Card/Panel container
  card: {
    background: colors.slate[900],
    borderRadius: borderRadius.lg,
    border: `1px solid ${colors.slate[700]}`,
    boxShadow: shadows.popover,
    overflow: 'hidden',
  } as CSSProperties,
  
  // Card with glass effect
  cardGlass: {
    background: 'rgba(15, 23, 42, 0.95)',
    backdropFilter: 'blur(8px)',
    borderRadius: borderRadius.lg,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: shadows.popover,
    overflow: 'hidden',
  } as CSSProperties,
  
  // Header section
  header: {
    padding: `${spacing[3]} ${spacing[4]}`,
    borderBottom: `1px solid ${colors.slate[700]}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as CSSProperties,
  
  // Gradient header (blue-violet)
  headerGradient: {
    padding: `${spacing[3]} ${spacing[4]}`,
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: `linear-gradient(135deg, ${colors.blue[800]} 0%, ${colors.violet[600]} 100%)`,
  } as CSSProperties,
  
  // Title text
  title: {
    margin: 0,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    fontFamily: fontFamily.sans,
  } as CSSProperties,
  
  // Close button
  closeButton: {
    background: 'none',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.7)',
    cursor: 'pointer',
    fontSize: fontSize.xl,
    padding: `0 ${spacing[1]}`,
    lineHeight: 1,
    transition: transitions.fast,
  } as CSSProperties,
  
  // Section container
  section: {
    padding: `${spacing[3]} ${spacing[4]}`,
    borderBottom: `1px solid ${colors.slate[700]}`,
  } as CSSProperties,
  
  // Section label
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: colors.slate[400],
    marginBottom: spacing[2],
    fontFamily: fontFamily.sans,
  } as CSSProperties,
  
  // Button base
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1.5],
    padding: `${spacing[1.5]} ${spacing[2.5]}`,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    fontFamily: fontFamily.sans,
    borderRadius: borderRadius.sm,
    cursor: 'pointer',
    transition: transitions.default,
    border: 'none',
    outline: 'none',
  } as CSSProperties,
  
  // Primary button
  buttonPrimary: {
    background: colors.blue[600],
    color: colors.foreground,
    border: `1px solid ${colors.blue[500]}`,
  } as CSSProperties,
  
  // Secondary/ghost button
  buttonSecondary: {
    background: colors.slate[800],
    color: colors.slate[400],
    border: `1px solid ${colors.slate[600]}`,
  } as CSSProperties,
  
  // Success button (green, for CDL)
  buttonSuccess: {
    background: `linear-gradient(135deg, ${colors.green[800]} 0%, ${colors.green[500]} 100%)`,
    color: colors.foreground,
    border: `1px solid ${colors.green[500]}`,
  } as CSSProperties,
  
  // Badge/chip
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${spacing[0.5]} ${spacing[1.5]}`,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    fontFamily: fontFamily.mono,
    borderRadius: borderRadius.sm,
  } as CSSProperties,
  
  // Info box (blue tint)
  infoBox: {
    padding: `${spacing[2.5]} ${spacing[4]}`,
    background: 'rgba(59, 130, 246, 0.1)',
    borderBottom: `1px solid ${colors.slate[700]}`,
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    fontSize: fontSize.sm,
    color: colors.blue[400],
    fontFamily: fontFamily.sans,
  } as CSSProperties,
  
  // Error box
  errorBox: {
    padding: spacing[3],
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid #ef4444',
    borderRadius: borderRadius.md,
    color: '#fca5a5',
    fontSize: fontSize.sm,
    fontFamily: fontFamily.sans,
  } as CSSProperties,
  
  // Result card
  resultCard: {
    background: colors.slate[800],
    border: `1px solid ${colors.slate[700]}`,
    borderRadius: borderRadius.lg,
    marginBottom: spacing[2],
    overflow: 'hidden',
    cursor: 'pointer',
    transition: transitions.default,
  } as CSSProperties,
  
  // Result card header
  resultCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${spacing[2]} ${spacing[3]}`,
    borderBottom: `1px solid ${colors.slate[700]}`,
  } as CSSProperties,
  
  // Result card body
  resultCardBody: {
    padding: `${spacing[2.5]} ${spacing[3]}`,
  } as CSSProperties,
  
  // Monospace text (coordinates, IDs)
  mono: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    color: colors.slate[400],
  } as CSSProperties,
  
  // Scrollable area
  scrollArea: {
    flex: 1,
    overflow: 'auto',
    padding: `${spacing[3]} ${spacing[4]}`,
  } as CSSProperties,
  
  // Spinner animation keyframes (use with style tag)
  spinnerKeyframes: `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `,
  
  // Spinner element
  spinner: {
    width: '24px',
    height: '24px',
    border: `3px solid ${colors.slate[700]}`,
    borderTop: `3px solid ${colors.blue[500]}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 8px',
  } as CSSProperties,
  
  // Empty state
  emptyState: {
    textAlign: 'center' as const,
    padding: `${spacing[8]} ${spacing[4]}`,
    color: colors.slate[500],
    fontFamily: fontFamily.sans,
  } as CSSProperties,
  
  // Tooltip styling (can be used with title attribute or custom tooltip)
  tooltip: {
    background: colors.slate[900],
    color: colors.foreground,
    padding: `${spacing[1.5]} ${spacing[2.5]}`,
    borderRadius: borderRadius.md,
    fontSize: fontSize.xs,
    boxShadow: shadows.lg,
    border: `1px solid ${colors.slate[700]}`,
  } as CSSProperties,
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Merge multiple style objects together
 * Usage: style={mergeStyles(theme.button, theme.buttonPrimary, { marginTop: 10 })}
 */
export function mergeStyles(...styles: (CSSProperties | undefined | false)[]): CSSProperties {
  return Object.assign({}, ...styles.filter(Boolean));
}

/**
 * Create hover state handlers for inline styles
 * Usage: {...hoverProps(normalStyle, hoverStyle, setIsHovered)}
 */
export function createHoverHandlers(
  setHover: (hover: boolean) => void
): { onMouseEnter: () => void; onMouseLeave: () => void } {
  return {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
  };
}

/**
 * Get a gradient background for layer type
 */
export function getLayerGradient(layerType: 'default' | 'cdl' | 'primary'): string {
  switch (layerType) {
    case 'cdl':
      return `linear-gradient(135deg, ${colors.green[800]} 0%, ${colors.green[500]} 100%)`;
    case 'primary':
      return `linear-gradient(135deg, ${colors.blue[800]} 0%, ${colors.violet[600]} 100%)`;
    default:
      return colors.slate[800];
  }
}

/**
 * Get contrasting text color for a background
 */
export function getContrastColor(hexColor: string): string {
  // Handle hex colors
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) return colors.foreground;
  
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

// Export everything as default too
export default {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  fontFamily,
  shadows,
  transitions,
  theme,
  mergeStyles,
  createHoverHandlers,
  getLayerGradient,
  getContrastColor,
};
