import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { type WorkspaceCatchUpViewModel } from '@web/app/features/workspaces/view-models/workspace-catch-up.view-model';
import { EmptyStateComponent } from '@web/app/shared/ui/empty-state/empty-state.component';
import { EntityListItemComponent } from '@web/app/shared/ui/entity-list-item/entity-list-item.component';
import { PillComponent } from '@web/app/shared/ui/pill/pill.component';
import { ShellSectionCardComponent } from '@web/app/shared/ui/shell-section-card/shell-section-card.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EmptyStateComponent,
    EntityListItemComponent,
    PillComponent,
    RouterLink,
    ShellSectionCardComponent,
  ],
  selector: 'app-workspace-catch-up-panel',
  styleUrl: './workspace-catch-up-panel.component.scss',
  templateUrl: './workspace-catch-up-panel.component.html',
})
export class WorkspaceCatchUpPanelComponent {
  public readonly activityCards =
    input.required<readonly { readonly body: string; readonly title: string }[]>();
  public readonly catchUpItems = input.required<readonly WorkspaceCatchUpViewModel[]>();
  public readonly isPending = input.required<boolean>();
}
