import { type ToastLevel } from '@web/app/core/models/toast-level.type';

export interface AuthSubmissionResult {
  readonly level: ToastLevel;
  readonly message: string;
  readonly title: string;
}
