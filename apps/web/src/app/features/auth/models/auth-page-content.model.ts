import { type AuthFormMode } from '@web/app/features/auth/types/auth-form-mode.type';

export interface AuthPageContent {
  readonly alternateActionLabel: string;
  readonly alternateActionRoute: string;
  readonly alternateActionText: string;
  readonly description: string;
  readonly eyebrow: string;
  readonly mode: AuthFormMode;
  readonly pendingSubmitLabel: string;
  readonly submitLabel: string;
  readonly title: string;
}
