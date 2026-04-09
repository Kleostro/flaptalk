import { t, type Static } from 'elysia';

import { MessageModel } from './messages';
import { RoomModel } from './rooms';

export const UpdateRoomReadStateRequestBodyModel = t.Object({
  lastReadMessageId: t.Numeric(),
});

export type UpdateRoomReadStateRequestBody = Static<typeof UpdateRoomReadStateRequestBodyModel>;

export const RoomReadStateModel = t.Object({
  lastReadMessageId: t.Nullable(t.Numeric()),
  roomId: t.Numeric(),
  updatedAt: t.String({
    format: 'date-time',
  }),
  userId: t.Numeric(),
});

export type RoomReadState = Static<typeof RoomReadStateModel>;

export const WorkspaceRoomActivityModel = t.Object({
  lastMessage: t.Nullable(MessageModel),
  readState: t.Nullable(RoomReadStateModel),
  room: RoomModel,
  unreadMessageCount: t.Numeric(),
});

export type WorkspaceRoomActivity = Static<typeof WorkspaceRoomActivityModel>;

export const ReadStatesModel = {
  'readStates.activity.response': t.Object({
    rooms: t.Array(WorkspaceRoomActivityModel),
    unreadMessageCount: t.Numeric(),
    unreadRoomCount: t.Numeric(),
  }),
  'readStates.entity': RoomReadStateModel,
  'readStates.update.body': UpdateRoomReadStateRequestBodyModel,
  'readStates.update.response': RoomReadStateModel,
  'readStates.workspaceRoomActivity': WorkspaceRoomActivityModel,
};
