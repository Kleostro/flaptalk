import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-shell-panel-header',
  styleUrl: './shell-panel-header.scss',
  templateUrl: './shell-panel-header.html',
})
export class ShellPanelHeaderComponent {
  public readonly tag = input<string>();
  public readonly title = input.required<string>();
}
