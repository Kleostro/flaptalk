import { type ToastLevel } from '@web/app/core/models/toast-level.type';

export interface ToastItem {
  readonly durationMs: number;
  readonly id: string;
  readonly level: ToastLevel;
  readonly message: string;
  readonly title: string;
  readonly visible: boolean;
}
