import { t, type Static } from 'elysia';

const ROOM_NAME_MAX_LENGTH = 120;
const ROOM_NAME_MIN_LENGTH = 1;
const ROOM_DESCRIPTION_MAX_LENGTH = 500;

export const RoomModel = t.Object({
  createdAt: t.String({
    format: 'date-time',
  }),
  description: t.Nullable(t.String()),
  id: t.Numeric(),
  name: t.String(),
  slug: t.String(),
  updatedAt: t.String({
    format: 'date-time',
  }),
  workspaceId: t.Numeric(),
});

export type Room = Static<typeof RoomModel>;

export const CreateRoomRequestBodyModel = t.Object({
  description: t.Optional(
    t.String({
      maxLength: ROOM_DESCRIPTION_MAX_LENGTH,
    }),
  ),
  name: t.String({
    maxLength: ROOM_NAME_MAX_LENGTH,
    minLength: ROOM_NAME_MIN_LENGTH,
  }),
});

export type CreateRoomRequestBody = Static<typeof CreateRoomRequestBodyModel>;

export const RoomsModel = {
  'rooms.create.body': CreateRoomRequestBodyModel,
  'rooms.create.response': RoomModel,
  'rooms.entity': RoomModel,
  'rooms.list.response': t.Object({
    rooms: t.Array(RoomModel),
  }),
};
