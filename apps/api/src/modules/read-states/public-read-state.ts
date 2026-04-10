import { serializeMessage } from '@api/modules/messages/public-message';
import { serializeRoom } from '@api/modules/rooms/public-room';
import { serializeUser } from '@api/modules/users/public-user';

type SerializableReadState = {
  readonly lastReadMessageId: null | number;
  readonly roomId: number;
  readonly updatedAt: Date;
  readonly userId: number;
};

type SerializableWorkspaceRoomActivity = {
  readonly lastMessage: null | Parameters<typeof serializeMessage>[0];
  readonly readState: null | SerializableReadState;
  readonly room: Parameters<typeof serializeRoom>[0];
  readonly unreadMessageCount: number;
};

type SerializableWorkspaceCatchUpItem = {
  readonly contextType: 'room_message' | 'thread_reply';
  readonly lastActivityAt: Date | null;
  readonly lastAuthor: null | ReturnType<typeof serializeUser>;
  readonly preview: string;
  readonly resumeMode: 'latest' | 'unread';
  readonly room: ReturnType<typeof serializeRoom>;
  readonly threadRootMessageId: null | number;
  readonly unreadMessageCount: number;
};

export function serializeReadState(readState: SerializableReadState) {
  return {
    ...readState,
    updatedAt: readState.updatedAt.toISOString(),
  };
}

export function serializeWorkspaceRoomActivity(activity: SerializableWorkspaceRoomActivity) {
  return {
    lastMessage: activity.lastMessage ? serializeMessage(activity.lastMessage) : null,
    readState: activity.readState ? serializeReadState(activity.readState) : null,
    room: serializeRoom(activity.room),
    unreadMessageCount: activity.unreadMessageCount,
  };
}

export function serializeWorkspaceCatchUpItem(item: SerializableWorkspaceCatchUpItem) {
  return {
    contextType: item.contextType,
    lastActivityAt: item.lastActivityAt ? item.lastActivityAt.toISOString() : null,
    lastAuthor: item.lastAuthor,
    preview: item.preview,
    resumeMode: item.resumeMode,
    room: item.room,
    threadRootMessageId: item.threadRootMessageId,
    unreadMessageCount: item.unreadMessageCount,
  };
}
