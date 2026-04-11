import { formatDate } from '@angular/common';
import { type WorkspaceCatchUpItem } from '@flaptalk/api-contract';

import { APP_ROUTE_PATHS } from '@web/app/core/constants/app-routes.constants';

export interface WorkspaceCatchUpViewModel {
  readonly authorLabel: string;
  readonly catchUpKey: string;
  readonly contextLabel: string;
  readonly description: string;
  readonly hasUnreadMessages: boolean;
  readonly latestPreviewLabel: string;
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
  readonly threadPreview: null | string;
  readonly unreadLabel: string;
}

const PREVIEW_MAX_LENGTH = 160;

const truncatePreview = (value: string): string => {
  const normalizedValue = value.trim().replaceAll(/\s+/g, ' ');

  if (normalizedValue.length <= PREVIEW_MAX_LENGTH) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, PREVIEW_MAX_LENGTH - 1).trimEnd()}…`;
};

// eslint-disable-next-line max-lines-per-function
export function createWorkspaceCatchUpViewModel(
  item: WorkspaceCatchUpItem,
): WorkspaceCatchUpViewModel {
  const isThreadContext = item.contextType === 'thread_reply';
  const authorLabel =
    item.lastMessage?.author.email ?? item.lastAuthor?.email ?? 'Recent workspace activity';
  const contextLabel = isThreadContext ? 'Thread reply' : 'Room message';
  const hasUnreadMessages = item.unreadMessageCount > 0;
  const unreadLabel = hasUnreadMessages ? `${item.unreadMessageCount} unread` : 'Recently active';
  const resumeLabel = isThreadContext
    ? hasUnreadMessages
      ? 'Resume thread'
      : 'Open thread'
    : hasUnreadMessages
      ? 'Resume unread'
      : 'Open room';
  const queryParams = item.threadRootMessageId
    ? {
        resume: item.resumeMode,
        thread: String(item.threadRootMessageId),
      }
    : {
        resume: item.resumeMode,
      };
  const catchUpKey = item.threadRootMessageId
    ? `thread:${item.threadRootMessageId}`
    : `room:${item.room.id}`;
  const threadPreview = item.threadRootMessage
    ? truncatePreview(item.threadRootMessage.body)
    : null;
  const latestMessagePreview = item.lastMessage ? truncatePreview(item.lastMessage.body) : null;
  const preview = latestMessagePreview ?? truncatePreview(item.preview);
  const latestPreviewLabel = isThreadContext ? 'Latest reply' : 'Latest message';
  const secondaryMeta = [
    contextLabel,
    item.lastMessage?.author.email ?? item.lastAuthor?.email ?? null,
    item.lastActivityAt ? formatDate(item.lastActivityAt, 'MMM d, HH:mm', 'en-US') : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const description = isThreadContext
    ? [
        `A thread continuation is waiting in ${item.room.name}.`,
        'We pinned the root discussion and the latest reply so you can resume with context.',
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
    catchUpKey,
    contextLabel,
    description,
    hasUnreadMessages,
    latestPreviewLabel,
    preview,
    queryParams,
    resumeLabel,
    roomId: item.room.id,
    roomLink: ['/', APP_ROUTE_PATHS.workspace, 'rooms', String(item.room.id)],
    roomName: item.room.name,
    secondaryMeta,
    threadPreview,
    unreadLabel,
  };
}
