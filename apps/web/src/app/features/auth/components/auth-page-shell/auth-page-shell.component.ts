import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

import { ThemeService } from '@web/app/core/services/theme.service';
import { type AuthFormMode } from '@web/app/features/auth/types/auth-form-mode.type';
import { CardComponent } from '@web/app/shared/ui/card/card';
import { LinkComponent } from '@web/app/shared/ui/link/link';
import { ThemeSwitcherComponent } from '@web/app/shared/ui/theme-switcher/theme-switcher';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardComponent, LinkComponent, ThemeSwitcherComponent],
  selector: 'app-auth-page-shell',
  styleUrl: './auth-page-shell.component.scss',
  templateUrl: './auth-page-shell.component.html',
})
export class AuthPageShellComponent {
  private readonly themeService = inject(ThemeService);

  public readonly alternateActionLabel = input.required<string>();
  public readonly alternateActionRoute = input.required<string>();
  public readonly alternateActionText = input.required<string>();
  public readonly description = input.required<string>();
  public readonly eyebrow = input.required<string>();
  public readonly mode = input.required<AuthFormMode>();
  public readonly themeMode = this.themeService.mode;
  public readonly themeOptions = this.themeService.options;
  public readonly title = input.required<string>();

  public setTheme(mode: Parameters<ThemeService['setMode']>[0]): void {
    this.themeService.setMode(mode);
  }
}
