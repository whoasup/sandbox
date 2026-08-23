/**
 * Typed mirror of the CSS custom properties declared in `styles/tokens.css`.
 *
 * Values are `var(--ui-*)` references rather than literals, so consuming code
 * stays theme-aware: switching `data-theme` changes what these resolve to.
 * Useful for inline styles, chart libraries and Three.js materials that cannot
 * read a CSS class.
 */

export const colorTokens = {
  bg: 'var(--ui-color-bg)',
  surface: 'var(--ui-color-surface)',
  surfaceRaised: 'var(--ui-color-surface-raised)',
  surfaceMuted: 'var(--ui-color-surface-muted)',
  text: 'var(--ui-color-text)',
  textMuted: 'var(--ui-color-text-muted)',
  textInverse: 'var(--ui-color-text-inverse)',
  border: 'var(--ui-color-border)',
  borderStrong: 'var(--ui-color-border-strong)',
  primary: 'var(--ui-color-primary)',
  primaryHover: 'var(--ui-color-primary-hover)',
  primarySoft: 'var(--ui-color-primary-soft)',
  onPrimary: 'var(--ui-color-on-primary)',
  success: 'var(--ui-color-success)',
  warning: 'var(--ui-color-warning)',
  danger: 'var(--ui-color-danger)',
  overlay: 'var(--ui-color-overlay)',
} as const;

export const spaceTokens = {
  0: 'var(--ui-space-0)',
  1: 'var(--ui-space-1)',
  2: 'var(--ui-space-2)',
  3: 'var(--ui-space-3)',
  4: 'var(--ui-space-4)',
  5: 'var(--ui-space-5)',
  6: 'var(--ui-space-6)',
  7: 'var(--ui-space-7)',
  8: 'var(--ui-space-8)',
} as const;

export const radiusTokens = {
  sm: 'var(--ui-radius-sm)',
  md: 'var(--ui-radius-md)',
  lg: 'var(--ui-radius-lg)',
  xl: 'var(--ui-radius-xl)',
  full: 'var(--ui-radius-full)',
} as const;

export const fontSizeTokens = {
  xs: 'var(--ui-font-size-xs)',
  sm: 'var(--ui-font-size-sm)',
  md: 'var(--ui-font-size-md)',
  lg: 'var(--ui-font-size-lg)',
  xl: 'var(--ui-font-size-xl)',
  '2xl': 'var(--ui-font-size-2xl)',
  '3xl': 'var(--ui-font-size-3xl)',
} as const;

export const shadowTokens = {
  sm: 'var(--ui-shadow-sm)',
  md: 'var(--ui-shadow-md)',
  lg: 'var(--ui-shadow-lg)',
} as const;

export const zIndexTokens = {
  dropdown: 'var(--ui-z-dropdown)',
  overlay: 'var(--ui-z-overlay)',
  modal: 'var(--ui-z-modal)',
  toast: 'var(--ui-z-toast)',
} as const;

export const tokens = {
  color: colorTokens,
  space: spaceTokens,
  radius: radiusTokens,
  fontSize: fontSizeTokens,
  shadow: shadowTokens,
  zIndex: zIndexTokens,
} as const;

export type ColorToken = keyof typeof colorTokens;
export type SpaceToken = keyof typeof spaceTokens;
export type RadiusToken = keyof typeof radiusTokens;
export type FontSizeToken = keyof typeof fontSizeTokens;
export type ShadowToken = keyof typeof shadowTokens;
export type Tokens = typeof tokens;
