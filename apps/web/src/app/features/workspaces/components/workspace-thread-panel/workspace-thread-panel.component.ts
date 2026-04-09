import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { type Message } from '@flaptalk/api-contract';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  selector: 'app-workspace-thread-panel',
  styleUrl: './workspace-thread-panel.component.scss',
  templateUrl: './workspace-thread-panel.component.html',
})
export class WorkspaceThreadPanelComponent {
  public readonly isPending = input.required<boolean>();
  public readonly replies = input.required<readonly Message[]>();
  public readonly rootMessage = input<Message | null>(null);

  public getMessageAuthorInitials(email: string): string {
    const [localPart = ''] = email.split('@');
    const initials = localPart
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 2)
      .toUpperCase();

    return initials || 'FT';
  }
}
