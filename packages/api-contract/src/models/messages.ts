import { t, type Static } from 'elysia';

import { PublicUserModel } from './users';

const MESSAGE_BODY_MAX_LENGTH = 4000;
const MESSAGE_BODY_MIN_LENGTH = 1;

export const MessageModel = t.Object({
  author: PublicUserModel,
  body: t.String(),
  createdAt: t.String({
    format: 'date-time',
  }),
  id: t.Numeric(),
  parentMessageId: t.Nullable(t.Numeric()),
  roomId: t.Numeric(),
  updatedAt: t.String({
    format: 'date-time',
  }),
});

export type Message = Static<typeof MessageModel>;

export const CreateMessageRequestBodyModel = t.Object({
  body: t.String({
    maxLength: MESSAGE_BODY_MAX_LENGTH,
    minLength: MESSAGE_BODY_MIN_LENGTH,
  }),
  parentMessageId: t.Optional(t.Nullable(t.Numeric())),
});

export type CreateMessageRequestBody = Static<typeof CreateMessageRequestBodyModel>;

export const MessagesModel = {
  'messages.create.body': CreateMessageRequestBodyModel,
  'messages.create.response': MessageModel,
  'messages.entity': MessageModel,
  'messages.list.response': t.Object({
    messages: t.Array(MessageModel),
  }),
  'messages.thread.response': t.Object({
    replies: t.Array(MessageModel),
    rootMessage: MessageModel,
  }),
};
