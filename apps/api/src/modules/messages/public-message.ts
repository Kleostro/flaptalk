import { publicUserSelect, serializeUser } from '@api/modules/users/public-user';

const messageSelect = {
  author: {
    select: publicUserSelect,
  },
  body: true,
  createdAt: true,
  id: true,
  roomId: true,
  updatedAt: true,
} as const;

type SerializableMessage = {
  readonly author: Parameters<typeof serializeUser>[0];
  readonly body: string;
  readonly createdAt: Date;
  readonly id: number;
  readonly roomId: number;
  readonly updatedAt: Date;
};

export function serializeMessage(message: SerializableMessage) {
  return {
    ...message,
    author: serializeUser(message.author),
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
  };
}

export { messageSelect };
