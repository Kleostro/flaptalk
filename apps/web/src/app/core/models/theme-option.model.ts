import { type THEME_MODE } from '@web/app/core/constants/theme.constants';

export type ThemeMode = (typeof THEME_MODE)[keyof typeof THEME_MODE];

export interface ThemeOption {
  readonly label: string;
  readonly value: ThemeMode;
}
