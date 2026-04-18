import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { type Message } from '@flaptalk/api-contract';

import { WorkspaceMessageActionsComponent } from '@web/app/features/workspaces/components/workspace-message-actions/workspace-message-actions.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, WorkspaceMessageActionsComponent],
  selector: 'app-workspace-chat-message',
  styleUrl: './workspace-chat-message.component.scss',
  templateUrl: './workspace-chat-message.component.html',
})
export class WorkspaceChatMessageComponent {
  public readonly currentUserId = input<null | number>(null);
  public readonly isActiveThread = input(false);
  public readonly message = input.required<Message>();
  public readonly isOwnMessage = computed(
    () => this.currentUserId() !== null && this.message().author.id === this.currentUserId(),
  );
  public readonly isRootMessage = input(false);
  public readonly isUnread = input(false);
  public readonly showThreadAction = input(false);
  public readonly threadAction = output<number>();

  public getMessageAuthorInitials(email: string): string {
    const [localPart = ''] = email.split('@');
    const initials = localPart
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 2)
      .toUpperCase();

    return initials || 'FT';
  }

  public openThread(): void {
    this.threadAction.emit(this.message().id);
  }
}
