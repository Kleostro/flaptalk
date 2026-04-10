const roomSelect = {
  createdAt: true,
  description: true,
  id: true,
  name: true,
  slug: true,
  updatedAt: true,
  workspaceId: true,
} as const;

type SerializableRoom = {
  readonly createdAt: Date;
  readonly description: null | string;
  readonly id: number;
  readonly name: string;
  readonly slug: string;
  readonly updatedAt: Date;
  readonly workspaceId: number;
};

export function serializeRoom(room: SerializableRoom) {
  return {
    ...room,
    createdAt: room.createdAt.toISOString(),
    updatedAt: room.updatedAt.toISOString(),
  };
}

export { roomSelect };
