import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { type WorkspaceMemberRow } from '@web/app/features/workspaces/types/workspace-member-row.model';
import { ButtonComponent } from '@web/app/shared/ui/button/button';
import { ConfirmPopoverComponent } from '@web/app/shared/ui/confirm-popover/confirm-popover.component';
import { EmptyStateComponent } from '@web/app/shared/ui/empty-state/empty-state.component';
import { EntityListItemComponent } from '@web/app/shared/ui/entity-list-item/entity-list-item.component';
import { PillComponent } from '@web/app/shared/ui/pill/pill.component';
import { ShellSectionCardComponent } from '@web/app/shared/ui/shell-section-card/shell-section-card.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
    ConfirmPopoverComponent,
    DatePipe,
    EmptyStateComponent,
    EntityListItemComponent,
    PillComponent,
    ShellSectionCardComponent,
  ],
  selector: 'app-workspace-members-panel',
  styleUrl: './workspace-members-panel.component.scss',
  templateUrl: './workspace-members-panel.component.html',
})
export class WorkspaceMembersPanelComponent {
  public readonly canManageMembers = input(false);
  public readonly emptyDescription = input(
    'No visible members yet. Accepted invites will start filling this roster.',
  );
  public readonly hasWorkspace = input.required<boolean>();
  public readonly isPending = input.required<boolean>();
  public readonly members = input.required<readonly WorkspaceMemberRow[]>();
  public readonly removeMember = output<number>();
  public readonly removingMemberId = input<null | number>(null);

  public canRemoveMember(member: WorkspaceMemberRow): boolean {
    return this.canManageMembers() && !member.isCurrentUser && member.role !== 'owner';
  }

  public getRemoveDescription(member: WorkspaceMemberRow): string {
    return `${member.user.email} will lose access to this workspace immediately.`;
  }

  public isRemoving(memberId: number): boolean {
    return this.removingMemberId() === memberId;
  }

  public onRemoveMember(memberId: number): void {
    this.removeMember.emit(memberId);
  }
}
