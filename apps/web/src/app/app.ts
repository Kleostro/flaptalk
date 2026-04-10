import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from '@web/app/core/services/theme.service';
import { ToastViewportComponent } from '@web/app/shared/ui/toast-viewport/toast-viewport.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, ToastViewportComponent],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly themeService = inject(ThemeService);
}
