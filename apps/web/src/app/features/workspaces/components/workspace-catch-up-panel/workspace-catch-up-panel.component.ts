import { formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { APP_ROUTE_PATHS } from '@web/app/core/constants/app-routes.constants';
import { EmptyStateComponent } from '@web/app/shared/ui/empty-state/empty-state.component';
import { EntityListItemComponent } from '@web/app/shared/ui/entity-list-item/entity-list-item.component';
import { PillComponent } from '@web/app/shared/ui/pill/pill.component';
import { ShellSectionCardComponent } from '@web/app/shared/ui/shell-section-card/shell-section-card.component';
import { type WorkspaceCatchUpItem } from '@web/app/features/workspaces/types/workspace-catch-up-item.model';

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
  public readonly catchUpItems = input.required<readonly WorkspaceCatchUpItem[]>();
  public readonly isPending = input.required<boolean>();

  public getResumeQueryParams(roomActivity: WorkspaceCatchUpItem): {
    readonly resume: string;
    readonly thread?: string;
  } {
    return roomActivity.threadRootMessageId
      ? {
          resume: roomActivity.resumeMode,
          thread: String(roomActivity.threadRootMessageId),
        }
      : {
          resume: roomActivity.resumeMode,
        };
  }

  public getRoomRoute(roomId: number): string[] {
    return ['/', APP_ROUTE_PATHS.workspace, 'rooms', String(roomId)];
  }

  public getSecondaryMeta(roomActivity: WorkspaceCatchUpItem): string {
    const metaParts = [
      roomActivity.contextLabel,
      roomActivity.lastAuthorEmail,
      roomActivity.lastActivityAt
        ? formatDate(roomActivity.lastActivityAt, 'MMM d, HH:mm', 'en-US')
        : null,
    ].filter(Boolean);

    return metaParts.join(' · ');
  }
}
