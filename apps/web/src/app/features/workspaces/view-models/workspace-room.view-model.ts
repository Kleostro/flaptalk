import { type Message, type Room, type WorkspaceMemberRole } from '@flaptalk/api-contract';

import { APP_ROUTE_PATHS } from '@web/app/core/constants/app-routes.constants';
import { type BreadcrumbItem } from '@web/app/shared/ui/breadcrumbs/breadcrumbs.component';
import { type KeyValueListItem } from '@web/app/shared/ui/key-value-list/key-value-list.models';

export interface WorkspaceRoomViewModel {
  readonly breadcrumbs: readonly BreadcrumbItem[];
  readonly detailItems: readonly KeyValueListItem[];
  readonly feedTitle: string;
  readonly headerDescription: string;
  readonly headerTitle: string;
  readonly healthRows: readonly KeyValueListItem[];
  readonly resumeBanner: null | {
    readonly description: string;
    readonly tag: string;
    readonly title: string;
  };
  readonly roomDescription: string;
  readonly threadPanelDescription: string;
  readonly threadPanelTag: string;
}

interface CreateWorkspaceRoomViewModelInput {
  readonly currentWorkspaceName: null | string;
  readonly currentWorkspaceRole: null | WorkspaceMemberRole;
  readonly hasSelectedThread: boolean;
  readonly messageCount: number;
  readonly resumeMode: 'default' | 'first-unread' | 'latest';
  readonly room: null | Room;
  readonly selectedThreadReplyCount: number;
  readonly selectedThreadRootMessage: Message | null;
  readonly unreadMessageCount: number;
}

const EMPTY_STATE_VALUE = '—';
const WORKSPACE_BREADCRUMB_LABEL = 'Workspace';
const DEFAULT_FEED_TITLE = 'Room feed';
const DEFAULT_HEADER_TITLE = 'Room unavailable';
const ROOM_DESCRIPTION_FALLBACK =
  'This room does not have a description yet. It is ready to grow into a structured discussion surface.';

// eslint-disable-next-line max-lines-per-function
export function createWorkspaceRoomViewModel(
  input: CreateWorkspaceRoomViewModelInput,
): WorkspaceRoomViewModel {
  const roomName = input.room?.name ?? 'Room';
  const resumeBanner = input.hasSelectedThread
    ? {
        description:
          input.resumeMode === 'default'
            ? [
                'You are focused on a specific discussion thread.',
                'The thread panel keeps the root message and replies pinned together.',
              ].join(' ')
            : [
                'We restored the thread context directly from catch-up',
                'so you can continue where the latest discussion landed.',
              ].join(' '),
        tag: 'Resume',
        title: `Thread context restored in ${roomName}`,
      }
    : input.resumeMode === 'first-unread'
      ? {
          description:
            'The room feed will scroll to the first unread message so you can rebuild context from the right point.',
          tag: 'Unread',
          title: `Continue from the first unread message in ${roomName}`,
        }
      : input.resumeMode === 'latest'
        ? {
            description:
              'The room feed will jump to the latest activity so you can quickly inspect the most recent room state.',
            tag: 'Latest',
            title: `Start from the newest activity in ${roomName}`,
          }
        : null;
  const threadPanelDescription = input.hasSelectedThread
    ? input.selectedThreadReplyCount > 0
      ? [
          'The selected thread has',
          `${String(input.selectedThreadReplyCount).padStart(2, '0')} replies attached to the root message.`,
        ].join(' ')
      : 'The selected thread is ready for its first reply.'
    : 'Select a root message from the room feed to pin the discussion context in this panel.';

  return {
    breadcrumbs: [
      {
        href: ['/', APP_ROUTE_PATHS.workspace],
        label: WORKSPACE_BREADCRUMB_LABEL,
      },
      {
        href: null,
        label: roomName,
      },
    ],
    detailItems: [
      {
        label: 'Room ID',
        value: input.room ? String(input.room.id) : EMPTY_STATE_VALUE,
      },
      {
        label: 'Slug',
        value: input.room?.slug ?? EMPTY_STATE_VALUE,
      },
      {
        label: 'Workspace',
        value: input.currentWorkspaceName ?? EMPTY_STATE_VALUE,
      },
    ],
    feedTitle: input.room?.name ?? DEFAULT_FEED_TITLE,
    headerDescription: input.room
      ? 'Real-time messaging lives here now. Threads and catch-up layers will grow from this room feed next.'
      : 'The selected room could not be restored from the current workspace context.',
    headerTitle: input.room?.name ?? DEFAULT_HEADER_TITLE,
    healthRows: [
      {
        label: 'Messages',
        value: String(input.messageCount).padStart(2, '0'),
      },
      {
        label: 'Unread',
        value: String(input.unreadMessageCount).padStart(2, '0'),
      },
      {
        label: 'Owner access',
        value: input.currentWorkspaceRole === 'owner' ? 'Yes' : 'No',
      },
      {
        label: 'Thread layer',
        value: input.hasSelectedThread ? 'Open' : 'Ready',
      },
    ],
    resumeBanner,
    roomDescription: input.room?.description ?? ROOM_DESCRIPTION_FALLBACK,
    threadPanelDescription,
    threadPanelTag: input.hasSelectedThread ? 'Live' : 'Thread',
  };
}
