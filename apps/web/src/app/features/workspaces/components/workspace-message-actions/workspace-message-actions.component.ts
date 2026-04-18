import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ButtonComponent } from '@web/app/shared/ui/button/button';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent],
  selector: 'app-workspace-message-actions',
  styleUrl: './workspace-message-actions.component.scss',
  templateUrl: './workspace-message-actions.component.html',
})
export class WorkspaceMessageActionsComponent {
  public readonly isThreadOpen = input(false);
  public readonly showThreadAction = input(true);
  public readonly threadAction = output();
}
