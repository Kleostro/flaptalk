import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { CardComponent } from '@web/app/shared/ui/card/card';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardComponent],
  selector: 'app-shell-stat-card',
  styleUrl: './shell-stat-card.scss',
  templateUrl: './shell-stat-card.html',
})
export class ShellStatCardComponent {
  public readonly description = input.required<string>();
  public readonly label = input.required<string>();
  public readonly value = input.required<string>();
}
