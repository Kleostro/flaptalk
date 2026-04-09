import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-shell-nav-item',
  styleUrl: './shell-nav-item.scss',
  templateUrl: './shell-nav-item.html',
})
export class ShellNavItemComponent {
  public readonly active = input(false);
  public readonly description = input.required<string>();
  public readonly indexLabel = input.required<string>();
  public readonly title = input.required<string>();
}
