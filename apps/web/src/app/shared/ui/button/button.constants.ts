export const BUTTON_APPEARANCE = {
  primary: 'primary',
  secondary: 'secondary',
  tertiary: 'tertiary',
} as const;

export type ButtonAppearance = (typeof BUTTON_APPEARANCE)[keyof typeof BUTTON_APPEARANCE];

export const BUTTON_SIZE = {
  large: 'large',
  medium: 'medium',
} as const;

export type ButtonSize = (typeof BUTTON_SIZE)[keyof typeof BUTTON_SIZE];

export const BUTTON_TYPE = {
  button: 'button',
  reset: 'reset',
  submit: 'submit',
} as const;

export type ButtonType = (typeof BUTTON_TYPE)[keyof typeof BUTTON_TYPE];
