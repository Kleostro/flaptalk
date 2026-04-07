import { Injectable, signal } from '@angular/core';

import { TOAST_LEVEL, type ToastLevel } from '@web/app/core/models/toast-level.type';
import { type ToastItem } from '@web/app/core/models/toast-item.model';

const DEFAULT_TOAST_DURATION_MS = 4200;
const EXIT_TOAST_DURATION_MS = 220;

interface ShowToastOptions {
  readonly durationMs?: number;
  readonly message: string;
  readonly title: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  public readonly toasts = signal<readonly ToastItem[]>([]);

  private createToast(level: ToastLevel, options: ShowToastOptions): ToastItem {
    return {
      durationMs: options.durationMs ?? DEFAULT_TOAST_DURATION_MS,
      id: globalThis.crypto.randomUUID(),
      level,
      message: options.message,
      title: options.title,
      visible: false,
    };
  }

  private showToast(level: ToastLevel, options: ShowToastOptions): void {
    const toast = this.createToast(level, options);
    this.toasts.update((items) => [toast, ...items]);

    globalThis.requestAnimationFrame(() => {
      this.toasts.update((items) =>
        items.map((item) => (item.id === toast.id ? { ...item, visible: true } : item)),
      );
    });

    globalThis.setTimeout(() => {
      this.remove(toast.id);
    }, toast.durationMs);
  }

  public error(options: ShowToastOptions): void {
    this.showToast(TOAST_LEVEL.error, options);
  }

  public info(options: ShowToastOptions): void {
    this.showToast(TOAST_LEVEL.info, options);
  }

  public remove(id: string): void {
    const toast = this.toasts().find((item) => item.id === id);

    if (!toast?.visible) {
      return;
    }

    this.toasts.update((items) =>
      items.map((item) => (item.id === id ? { ...item, visible: false } : item)),
    );

    globalThis.setTimeout(() => {
      this.toasts.update((items) => items.filter((item) => item.id !== id));
    }, EXIT_TOAST_DURATION_MS);
  }

  public success(options: ShowToastOptions): void {
    this.showToast(TOAST_LEVEL.success, options);
  }
}
