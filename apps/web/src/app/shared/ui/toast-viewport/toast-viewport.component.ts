import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { TOAST_LEVEL } from '@web/app/core/models/toast-level.type';
import { ToastService } from '@web/app/core/services/toast.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-toast-viewport',
  styleUrl: './toast-viewport.component.scss',
  templateUrl: './toast-viewport.component.html',
})
export class ToastViewportComponent {
  private readonly toastService = inject(ToastService);

  public readonly toastLevel = TOAST_LEVEL;
  public readonly toasts = this.toastService.toasts;

  public dismiss(id: string): void {
    this.toastService.remove(id);
  }
}
