import { ChangeDetectionStrategy, Component, input } from '@angular/core';

type PillAppearance = 'accent' | 'neutral' | 'outline';
type PillSize = 'medium' | 'small';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-pill',
  styleUrl: './pill.component.scss',
  templateUrl: './pill.component.html',
})
export class PillComponent {
  public readonly appearance = input<PillAppearance>('neutral');
  public readonly caps = input(false);
  public readonly size = input<PillSize>('medium');
}
