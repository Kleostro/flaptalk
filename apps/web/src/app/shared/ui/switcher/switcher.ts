import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { type SwitcherOption } from '@web/app/shared/ui/switcher/switcher-option.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-switcher',
  styleUrl: './switcher.scss',
  templateUrl: './switcher.html',
})
export class SwitcherComponent {
  public readonly options = input.required<readonly SwitcherOption[]>();
  public readonly value = input.required<string>();
  public readonly activeIndex = computed(() =>
    Math.max(
      this.options().findIndex((option) => option.value === this.value()),
      0,
    ),
  );
  public readonly ariaLabel = input.required<string>();
  public readonly valueChange = output<string>();
  public readonly visibleOptionCount = computed(() => Math.max(this.options().length, 1));

  public selectOption(value: string): void {
    this.valueChange.emit(value);
  }
}
