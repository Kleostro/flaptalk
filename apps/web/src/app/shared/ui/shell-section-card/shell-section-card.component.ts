import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { CardComponent } from '@web/app/shared/ui/card/card';
import { ShellPanelHeaderComponent } from '@web/app/shared/ui/shell-panel-header/shell-panel-header';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardComponent, ShellPanelHeaderComponent],
  selector: 'app-shell-section-card',
  styleUrl: './shell-section-card.component.scss',
  templateUrl: './shell-section-card.component.html',
})
export class ShellSectionCardComponent {
  public readonly tag = input<string>();
  public readonly title = input.required<string>();
}
