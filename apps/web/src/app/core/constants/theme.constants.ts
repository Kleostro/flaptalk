export const THEME_MODE = {
  dark: 'dark',
  light: 'light',
} as const;

export const THEME_STORAGE_KEY = 'flaptalk-theme';
export const THEME_SWITCHER_ARIA_LABEL = 'Theme switcher';

export const THEME_OPTIONS = [
  {
    label: 'Light',
    value: THEME_MODE.light,
  },
  {
    label: 'Dim',
    value: THEME_MODE.dark,
  },
] as const;
