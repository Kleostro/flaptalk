import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { THEME_MODE, THEME_SWITCHER_ARIA_LABEL } from '@web/app/core/constants/theme.constants';
import { type ThemeMode, type ThemeOption } from '@web/app/core/models/theme-option.model';
import { SwitcherComponent } from '@web/app/shared/ui/switcher/switcher';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SwitcherComponent],
  selector: 'app-theme-switcher',
  styleUrl: './theme-switcher.scss',
  templateUrl: './theme-switcher.html',
})
export class ThemeSwitcherComponent {
  public readonly currentTheme = input.required<ThemeMode>();
  public readonly options = input.required<readonly ThemeOption[]>();
  public readonly switcherAriaLabel = THEME_SWITCHER_ARIA_LABEL;
  public readonly themeSelected = output<ThemeMode>();

  private isThemeMode(mode: string): mode is ThemeMode {
    return mode === THEME_MODE.light || mode === THEME_MODE.dark;
  }

  public selectTheme(mode: string): void {
    if (!this.isThemeMode(mode)) {
      return;
    }

    this.themeSelected.emit(mode);
  }
}
