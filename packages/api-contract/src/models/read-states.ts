import { t, type Static } from 'elysia';

import { MessageModel } from './messages';
import { RoomModel } from './rooms';
import { PublicUserModel } from './users';

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

export const WorkspaceCatchUpContextTypeModel = t.Union([
  t.Literal('room_message'),
  t.Literal('thread_reply'),
]);

export type WorkspaceCatchUpContextType = Static<typeof WorkspaceCatchUpContextTypeModel>;

export const WorkspaceCatchUpResumeModeModel = t.Union([t.Literal('latest'), t.Literal('unread')]);

export type WorkspaceCatchUpResumeMode = Static<typeof WorkspaceCatchUpResumeModeModel>;

export const WorkspaceCatchUpItemModel = t.Object({
  contextType: WorkspaceCatchUpContextTypeModel,
  lastActivityAt: t.Nullable(
    t.String({
      format: 'date-time',
    }),
  ),
  lastAuthor: t.Nullable(PublicUserModel),
  lastMessage: t.Nullable(MessageModel),
  preview: t.String(),
  resumeMode: WorkspaceCatchUpResumeModeModel,
  room: RoomModel,
  threadRootMessage: t.Nullable(MessageModel),
  threadRootMessageId: t.Nullable(t.Numeric()),
  unreadMessageCount: t.Numeric(),
});

export type WorkspaceCatchUpItem = Static<typeof WorkspaceCatchUpItemModel>;

export const ReadStatesModel = {
  'readStates.activity.response': t.Object({
    rooms: t.Array(WorkspaceRoomActivityModel),
    unreadMessageCount: t.Numeric(),
    unreadRoomCount: t.Numeric(),
  }),
  'readStates.catchUp.item': WorkspaceCatchUpItemModel,
  'readStates.catchUp.response': t.Object({
    items: t.Array(WorkspaceCatchUpItemModel),
    primaryItem: t.Nullable(WorkspaceCatchUpItemModel),
  }),
  'readStates.entity': RoomReadStateModel,
  'readStates.update.body': UpdateRoomReadStateRequestBodyModel,
  'readStates.update.response': RoomReadStateModel,
  'readStates.workspaceRoomActivity': WorkspaceRoomActivityModel,
};
