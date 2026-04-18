import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-workspace-message-date-divider',
  styleUrl: './workspace-message-date-divider.component.scss',
  templateUrl: './workspace-message-date-divider.component.html',
})
export class WorkspaceMessageDateDividerComponent {
  public readonly label = input.required<string>();
}
