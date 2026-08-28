/**
 * Typed mirror of `styles/tokens.css`, for code that cannot consume CSS
 * variables directly (e.g. three.js materials). Keep values in sync with
 * the `:root` / `[data-theme='light']` block by hand — there are few enough
 * tokens that a build-time generator would be overkill for this MVP.
 */
export const palette = {
  white: '#ffffff',
  black: '#0b0d10',
  gray50: '#f6f7f8',
  gray100: '#eceef1',
  gray200: '#d7dbe0',
  gray300: '#b7bfc9',
  gray400: '#8b96a3',
  gray500: '#626d7a',
  gray600: '#454e59',
  gray700: '#2f363f',
  gray800: '#1d2229',
  gray900: '#12151a',
  blue400: '#5b9bf7',
  blue500: '#3b7ded',
  blue600: '#2c63c4',
  red500: '#e5484d',
  green500: '#30a46c',
} as const;

export const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
} as const;

export const radius = {
  sm: '4px',
  md: '8px',
  lg: '14px',
  full: '999px',
} as const;

export const tokens = {
  color: {
    surface: palette.white,
    surfaceRaised: palette.gray50,
    surfaceSunken: palette.gray100,
    border: palette.gray200,
    text: palette.gray900,
    textMuted: palette.gray500,
    textOnPrimary: palette.white,
    primary: palette.blue500,
    primaryHover: palette.blue600,
    danger: palette.red500,
    success: palette.green500,
  },
  spacing,
  radius,
} as const;

export type ColorToken = keyof typeof tokens.color;
export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
