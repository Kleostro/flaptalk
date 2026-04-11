import { formatDate } from '@angular/common';
import { type WorkspaceCatchUpItem } from '@flaptalk/api-contract';

import { APP_ROUTE_PATHS } from '@web/app/core/constants/app-routes.constants';

export interface WorkspaceCatchUpViewModel {
  readonly authorLabel: string;
  readonly contextLabel: string;
  readonly description: string;
  readonly hasUnreadMessages: boolean;
  readonly preview: string;
  readonly queryParams: {
    readonly resume: string;
    readonly thread?: string;
  };
  readonly resumeLabel: string;
  readonly roomId: number;
  readonly roomLink: readonly string[];
  readonly roomName: string;
  readonly secondaryMeta: string;
  readonly unreadLabel: string;
}

// eslint-disable-next-line max-lines-per-function
export function createWorkspaceCatchUpViewModel(
  item: WorkspaceCatchUpItem,
): WorkspaceCatchUpViewModel {
  const authorLabel = item.lastAuthor?.email ?? 'Recent workspace activity';
  const contextLabel = item.contextType === 'thread_reply' ? 'Thread reply' : 'Room message';
  const hasUnreadMessages = item.unreadMessageCount > 0;
  const unreadLabel = hasUnreadMessages ? `${item.unreadMessageCount} unread` : 'Recently active';
  const resumeLabel = hasUnreadMessages ? 'Resume unread' : 'Open room';
  const queryParams = item.threadRootMessageId
    ? {
        resume: item.resumeMode,
        thread: String(item.threadRootMessageId),
      }
    : {
        resume: item.resumeMode,
      };
  const secondaryMeta = [
    contextLabel,
    item.lastAuthor?.email ?? null,
    item.lastActivityAt ? formatDate(item.lastActivityAt, 'MMM d, HH:mm', 'en-US') : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const description = item.threadRootMessageId
    ? [
        `A thread continuation is waiting in ${item.room.name}.`,
        'Jump directly into the discussion where the latest reply landed.',
      ].join(' ')
    : hasUnreadMessages
      ? [
          `Unread room activity is waiting in ${item.room.name}.`,
          'Resume from the first unread message and rebuild context quickly.',
        ].join(' ')
      : [
          `The latest discussion in ${item.room.name} is still fresh.`,
          'Re-open the room and continue from the newest message.',
        ].join(' ');

  return {
    authorLabel,
    contextLabel,
    description,
    hasUnreadMessages,
    preview: item.preview,
    queryParams,
    resumeLabel,
    roomId: item.room.id,
    roomLink: ['/', APP_ROUTE_PATHS.workspace, 'rooms', String(item.room.id)],
    roomName: item.room.name,
    secondaryMeta,
    unreadLabel,
  };
}
