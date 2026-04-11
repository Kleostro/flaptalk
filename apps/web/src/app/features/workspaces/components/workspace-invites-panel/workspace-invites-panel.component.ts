import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { type Invite } from '@flaptalk/api-contract';
import { ButtonComponent } from '@web/app/shared/ui/button/button';
import { ConfirmPopoverComponent } from '@web/app/shared/ui/confirm-popover/confirm-popover.component';
import { EmptyStateComponent } from '@web/app/shared/ui/empty-state/empty-state.component';
import { EntityListItemComponent } from '@web/app/shared/ui/entity-list-item/entity-list-item.component';
import { KeyValueListComponent } from '@web/app/shared/ui/key-value-list/key-value-list.component';
import { type KeyValueListItem } from '@web/app/shared/ui/key-value-list/key-value-list.models';
import { PillComponent } from '@web/app/shared/ui/pill/pill.component';
import { ShellSectionCardComponent } from '@web/app/shared/ui/shell-section-card/shell-section-card.component';

type InviteStatusFilter = 'active' | 'all' | 'expired' | 'used';

const INVITE_COPY_RESET_DELAY_MS = 1800;
const INVITE_STATUS_FILTERS = ['active', 'used', 'expired', 'all'] as const;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
    ConfirmPopoverComponent,
    DatePipe,
    EmptyStateComponent,
    EntityListItemComponent,
    KeyValueListComponent,
    PillComponent,
    ShellSectionCardComponent,
  ],
  selector: 'app-workspace-invites-panel',
  styleUrl: './workspace-invites-panel.component.scss',
  templateUrl: './workspace-invites-panel.component.html',
})
export class WorkspaceInvitesPanelComponent {
  private readonly copiedTokenState = signal<null | string>(null);
  private copyResetTimeoutId: null | ReturnType<typeof setTimeout> = null;

  public readonly activeInviteCount = input.required<number>();
  public readonly canManageInvites = input.required<boolean>();
  public readonly copyInvite = output<string>();
  public readonly hasWorkspace = input.required<boolean>();
  public readonly invites = input.required<readonly Invite[]>();
  public readonly isPending = input.required<boolean>();
  public readonly revokeInvite = output<number>();
  public readonly revokingInviteId = input<null | number>(null);
  public readonly statusFilter = signal<InviteStatusFilter>('active');
  public readonly statusFilters = INVITE_STATUS_FILTERS;
  public readonly summaryItems = computed<readonly KeyValueListItem[]>(() => [
    {
      label: 'Active invites',
      value: String(this.activeInviteCount()),
    },
    {
      label: 'Total issued',
      value: String(this.invites().length),
    },
  ]);
  public readonly visibleInvites = computed(() => {
    const filter = this.statusFilter();

    return this.invites().filter((invite) => {
      const state = this.resolveInviteStatus(invite);

      return filter === 'all' ? true : state === filter;
    });
  });

  private resolveInviteStatus(invite: Invite): Exclude<InviteStatusFilter, 'all'> {
    if (invite.usedAt !== null) {
      return 'used';
    }

    return new Date(invite.expiresAt).getTime() <= Date.now() ? 'expired' : 'active';
  }

  public getInviteState(invite: Invite): string {
    if (invite.usedAt !== null) {
      return 'Used';
    }

    return new Date(invite.expiresAt).getTime() <= Date.now() ? 'Expired' : 'Active';
  }

  public getRevokeDescription(invite: Invite): string {
    if (invite.email) {
      return `This invite for ${invite.email} will stop working immediately.`;
    }

    return 'This invite link will stop working immediately.';
  }

  public isCopied(token: string): boolean {
    return this.copiedTokenState() === token;
  }

  public isRevoking(inviteId: number): boolean {
    return this.revokingInviteId() === inviteId;
  }

  public isUsed(invite: Invite): boolean {
    return invite.usedAt !== null;
  }

  public onCopyInvite(token: string): void {
    this.copiedTokenState.set(token);

    if (this.copyResetTimeoutId) {
      clearTimeout(this.copyResetTimeoutId);
    }

    this.copyResetTimeoutId = setTimeout(() => {
      this.copiedTokenState.set(null);
      this.copyResetTimeoutId = null;
    }, INVITE_COPY_RESET_DELAY_MS);

    this.copyInvite.emit(token);
  }

  public onRevokeInvite(inviteId: number): void {
    this.revokeInvite.emit(inviteId);
  }

  public setStatusFilter(filter: InviteStatusFilter): void {
    this.statusFilter.set(filter);
  }
}
