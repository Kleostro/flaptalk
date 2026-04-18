import { type Message, type Room } from '@flaptalk/api-contract';

export interface WorkspaceRoomViewModel {
  readonly feedTitle: string;
  readonly resumeBanner: null | {
    readonly description: string;
    readonly tag: string;
    readonly title: string;
  };
  readonly roomDescription: string;
  readonly threadPanelDescription: string;
  readonly threadPanelTitle: string;
}

interface CreateWorkspaceRoomViewModelInput {
  readonly hasSelectedThread: boolean;
  readonly resumeMode: 'default' | 'first-unread' | 'latest';
  readonly room: null | Room;
  readonly selectedThreadReplyCount: number;
  readonly selectedThreadRootMessage: Message | null;
}

const DEFAULT_FEED_TITLE = 'Room feed';
const ROOM_DESCRIPTION_FALLBACK =
  'This room is ready for focused discussion and lightweight thread follow-up.';

const createThreadResumeBanner = (
  roomName: string,
  resumeMode: CreateWorkspaceRoomViewModelInput['resumeMode'],
): NonNullable<WorkspaceRoomViewModel['resumeBanner']> => {
  return {
    description:
      resumeMode === 'default'
        ? [
            'A discussion thread is pinned on the right',
            'so replies stay attached to the original context.',
          ].join(' ')
        : [
            'We reopened the thread directly from catch-up',
            'so you can continue from the right message.',
          ].join(' '),
    tag: 'Resume',
    title: `Thread context restored in ${roomName}`,
  };
};

const createResumeBanner = (
  input: CreateWorkspaceRoomViewModelInput,
): WorkspaceRoomViewModel['resumeBanner'] => {
  const roomName = input.room?.name ?? 'Room';

  if (input.hasSelectedThread) {
    return createThreadResumeBanner(roomName, input.resumeMode);
  }

  if (input.resumeMode === 'first-unread') {
    return {
      description: [
        'The feed will scroll to the first unread message',
        'so you can rebuild context without losing the room timeline.',
      ].join(' '),
      tag: 'Unread',
      title: 'Continue from the first unread message',
    };
  }

  if (input.resumeMode === 'latest') {
    return {
      description: [
        'The feed will jump to the newest activity',
        'so the latest room state is immediately in view.',
      ].join(' '),
      tag: 'Latest',
      title: 'Start from the newest room activity',
    };
  }

  return null;
};

const createThreadPanelDescription = (input: CreateWorkspaceRoomViewModelInput): string => {
  if (!input.hasSelectedThread) {
    return 'Open a message thread to continue the discussion in a focused side rail.';
  }

  if (input.selectedThreadReplyCount === 0) {
    return 'The root message is pinned and ready for the first reply.';
  }

  return [
    `${String(input.selectedThreadReplyCount).padStart(2, '0')} replies stay attached`,
    'to the root message so the thread can continue without losing context.',
  ].join(' ');
};

export function createWorkspaceRoomViewModel(
  input: CreateWorkspaceRoomViewModelInput,
): WorkspaceRoomViewModel {
  return {
    feedTitle: input.room?.name ?? DEFAULT_FEED_TITLE,
    resumeBanner: createResumeBanner(input),
    roomDescription: input.room?.description ?? ROOM_DESCRIPTION_FALLBACK,
    threadPanelDescription: createThreadPanelDescription(input),
    threadPanelTitle: input.selectedThreadRootMessage ? 'Thread live' : 'Thread ready',
  };
}
