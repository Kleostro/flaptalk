import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const RoomReadStatePlain = t.Object(
  {
    id: t.Integer(),
    roomId: t.Integer(),
    userId: t.Integer(),
    lastReadMessageId: __nullable__(t.Integer()),
    updatedAt: t.Date(),
  },
  { additionalProperties: false },
);

export const RoomReadStateRelations = t.Object(
  {
    lastReadMessage: __nullable__(
      t.Object(
        {
          id: t.Integer(),
          roomId: t.Integer(),
          authorId: t.Integer(),
          parentMessageId: __nullable__(t.Integer()),
          body: t.String(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    ),
    room: t.Object(
      {
        id: t.Integer(),
        workspaceId: t.Integer(),
        name: t.String(),
        slug: t.String(),
        description: __nullable__(t.String()),
        createdAt: t.Date(),
        updatedAt: t.Date(),
      },
      { additionalProperties: false },
    ),
    user: t.Object(
      {
        id: t.Integer(),
        email: t.String(),
        hashedPassword: t.String(),
        createdAt: t.Date(),
        updatedAt: t.Date(),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const RoomReadStatePlainInputCreate = t.Object(
  {},
  { additionalProperties: false },
);

export const RoomReadStatePlainInputUpdate = t.Object(
  {},
  { additionalProperties: false },
);

export const RoomReadStateRelationsInputCreate = t.Object(
  {
    lastReadMessage: t.Optional(
      t.Object(
        {
          connect: t.Object(
            {
              id: t.Integer({ additionalProperties: false }),
            },
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    ),
    room: t.Object(
      {
        connect: t.Object(
          {
            id: t.Integer({ additionalProperties: false }),
          },
          { additionalProperties: false },
        ),
      },
      { additionalProperties: false },
    ),
    user: t.Object(
      {
        connect: t.Object(
          {
            id: t.Integer({ additionalProperties: false }),
          },
          { additionalProperties: false },
        ),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const RoomReadStateRelationsInputUpdate = t.Partial(
  t.Object(
    {
      lastReadMessage: t.Partial(
        t.Object(
          {
            connect: t.Object(
              {
                id: t.Integer({ additionalProperties: false }),
              },
              { additionalProperties: false },
            ),
            disconnect: t.Boolean(),
          },
          { additionalProperties: false },
        ),
      ),
      room: t.Object(
        {
          connect: t.Object(
            {
              id: t.Integer({ additionalProperties: false }),
            },
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
      user: t.Object(
        {
          connect: t.Object(
            {
              id: t.Integer({ additionalProperties: false }),
            },
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    },
    { additionalProperties: false },
  ),
);

export const RoomReadStateWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.Integer(),
          roomId: t.Integer(),
          userId: t.Integer(),
          lastReadMessageId: t.Integer(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "RoomReadState" },
  ),
);

export const RoomReadStateWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(
          t.Object(
            {
              id: t.Integer(),
              roomId_userId: t.Object(
                { roomId: t.Integer(), userId: t.Integer() },
                { additionalProperties: false },
              ),
            },
            { additionalProperties: false },
          ),
          { additionalProperties: false },
        ),
        t.Union(
          [
            t.Object({ id: t.Integer() }),
            t.Object({
              roomId_userId: t.Object(
                { roomId: t.Integer(), userId: t.Integer() },
                { additionalProperties: false },
              ),
            }),
          ],
          { additionalProperties: false },
        ),
        t.Partial(
          t.Object({
            AND: t.Union([
              Self,
              t.Array(Self, { additionalProperties: false }),
            ]),
            NOT: t.Union([
              Self,
              t.Array(Self, { additionalProperties: false }),
            ]),
            OR: t.Array(Self, { additionalProperties: false }),
          }),
          { additionalProperties: false },
        ),
        t.Partial(
          t.Object(
            {
              id: t.Integer(),
              roomId: t.Integer(),
              userId: t.Integer(),
              lastReadMessageId: t.Integer(),
              updatedAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "RoomReadState" },
);

export const RoomReadStateSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      roomId: t.Boolean(),
      userId: t.Boolean(),
      lastReadMessageId: t.Boolean(),
      updatedAt: t.Boolean(),
      lastReadMessage: t.Boolean(),
      room: t.Boolean(),
      user: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const RoomReadStateInclude = t.Partial(
  t.Object(
    {
      lastReadMessage: t.Boolean(),
      room: t.Boolean(),
      user: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const RoomReadStateOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      roomId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      userId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      lastReadMessageId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      updatedAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const RoomReadState = t.Composite(
  [RoomReadStatePlain, RoomReadStateRelations],
  { additionalProperties: false },
);

export const RoomReadStateInputCreate = t.Composite(
  [RoomReadStatePlainInputCreate, RoomReadStateRelationsInputCreate],
  { additionalProperties: false },
);

export const RoomReadStateInputUpdate = t.Composite(
  [RoomReadStatePlainInputUpdate, RoomReadStateRelationsInputUpdate],
  { additionalProperties: false },
);
