import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';

import {
  THEME_MODE,
  THEME_OPTIONS,
  THEME_STORAGE_KEY,
} from '@web/app/core/constants/theme.constants';
import { type ThemeMode, type ThemeOption } from '@web/app/core/models/theme-option.model';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly themeModeSignal = signal<ThemeMode>(this.resolveInitialMode());

  public readonly mode = this.themeModeSignal.asReadonly();
  public readonly options: readonly ThemeOption[] = THEME_OPTIONS;

  public constructor() {
    this.applyTheme(this.themeModeSignal());
  }

  private applyTheme(mode: ThemeMode): void {
    this.document.documentElement.dataset['theme'] = mode;
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  }

  private resolveInitialMode(): ThemeMode {
    const persistedMode = localStorage.getItem(THEME_STORAGE_KEY);

    if (persistedMode === THEME_MODE.dark || persistedMode === THEME_MODE.light) {
      return persistedMode;
    }

    return THEME_MODE.dark;
  }

  public setMode(mode: ThemeMode): void {
    this.themeModeSignal.set(mode);
    this.applyTheme(mode);
  }
}
