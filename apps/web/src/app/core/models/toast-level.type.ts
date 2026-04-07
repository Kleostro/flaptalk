export const TOAST_LEVEL = {
  error: 'error',
  info: 'info',
  success: 'success',
} as const;

export type ToastLevel = (typeof TOAST_LEVEL)[keyof typeof TOAST_LEVEL];
