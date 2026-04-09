import { serializeMessage } from '@api/modules/messages/public-message';
import { serializeRoom } from '@api/modules/rooms/public-room';

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
