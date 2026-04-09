import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { type Message, type Room } from '@flaptalk/api-contract';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  selector: 'app-workspace-room-feed',
  styleUrl: './workspace-room-feed.component.scss',
  templateUrl: './workspace-room-feed.component.html',
})
export class WorkspaceRoomFeedComponent {
  public readonly isPending = input.required<boolean>();
  public readonly messages = input.required<readonly Message[]>();
  public readonly room = input<null | Room>(null);

  public getMessageAuthorInitials(email: string): string {
    const [localPart = ''] = email.split('@');
    const initials = localPart
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 2)
      .toUpperCase();

    return initials || 'FT';
  }
}
