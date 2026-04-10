import { formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { type Workspace } from '@flaptalk/api-contract';
import { type WorkspaceMemberRow } from '@web/app/features/workspaces/types/workspace-member-row.model';
import { KeyValueListComponent } from '@web/app/shared/ui/key-value-list/key-value-list.component';
import { type KeyValueListItem } from '@web/app/shared/ui/key-value-list/key-value-list.models';
import { ShellSectionCardComponent } from '@web/app/shared/ui/shell-section-card/shell-section-card.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KeyValueListComponent, ShellSectionCardComponent],
  selector: 'app-workspace-overview-panel',
  styleUrl: './workspace-overview-panel.component.scss',
  templateUrl: './workspace-overview-panel.component.html',
})
export class WorkspaceOverviewPanelComponent {
  public readonly currentMember = input<null | WorkspaceMemberRow>(null);

  public readonly roomCount = input.required<number>();

  public readonly workspace = input<null | Workspace>(null);

  public readonly workspaceCount = input.required<number>();
  public readonly workspaceRole = input<'member' | 'owner' | null>(null);
  public readonly detailItems = computed<readonly KeyValueListItem[]>(() => {
    const workspace = this.workspace();
    const workspaceRole = this.workspaceRole();
    const detailItems: KeyValueListItem[] = [
      {
        label: 'Role',
        value: workspaceRole ?? '—',
      },
      {
        label: 'Rooms',
        value: String(this.roomCount()),
      },
      {
        label: 'Joined spaces',
        value: String(this.workspaceCount()),
      },
    ];

    if (workspaceRole === 'owner') {
      detailItems.push(...this.getOwnerDetailItems());
    } else {
      detailItems.push(...this.getMemberDetailItems());
    }

    detailItems.push({
      label: 'Created',
      value: this.formatDateValue(workspace?.createdAt ?? null, 'medium'),
    });

    return detailItems;
  });

  private formatDateValue(value: null | string | undefined, format: string): string {
    return value ? formatDate(value, format, 'en-US') : '—';
  }

  private getMemberDetailItems(): readonly KeyValueListItem[] {
    return [
      {
        label: 'Member since',
        value: this.formatDateValue(this.currentMember()?.joinedAt ?? null, 'mediumDate'),
      },
      {
        label: 'Workspace slug',
        value: this.workspace()?.slug ?? '—',
      },
    ];
  }

  private getOwnerDetailItems(): readonly KeyValueListItem[] {
    return [
      {
        label: 'Workspace ID',
        value: this.workspace()?.id ? String(this.workspace()?.id) : '—',
      },
      {
        label: 'Slug',
        value: this.workspace()?.slug ?? '—',
      },
      {
        label: 'Updated',
        value: this.formatDateValue(this.workspace()?.updatedAt ?? null, 'medium'),
      },
    ];
  }
}
