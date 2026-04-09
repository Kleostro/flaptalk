import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const RoomPlain = t.Object(
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
);

export const RoomRelations = t.Object(
  {
    messages: t.Array(
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
      { additionalProperties: false },
    ),
    workspace: t.Object(
      {
        id: t.Integer(),
        name: t.String(),
        slug: t.String(),
        description: __nullable__(t.String()),
        ownerId: t.Integer(),
        createdAt: t.Date(),
        updatedAt: t.Date(),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const RoomPlainInputCreate = t.Object(
  {
    name: t.String(),
    slug: t.String(),
    description: t.Optional(__nullable__(t.String())),
  },
  { additionalProperties: false },
);

export const RoomPlainInputUpdate = t.Object(
  {
    name: t.Optional(t.String()),
    slug: t.Optional(t.String()),
    description: t.Optional(__nullable__(t.String())),
  },
  { additionalProperties: false },
);

export const RoomRelationsInputCreate = t.Object(
  {
    messages: t.Optional(
      t.Object(
        {
          connect: t.Array(
            t.Object(
              {
                id: t.Integer({ additionalProperties: false }),
              },
              { additionalProperties: false },
            ),
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    ),
    workspace: t.Object(
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

export const RoomRelationsInputUpdate = t.Partial(
  t.Object(
    {
      messages: t.Partial(
        t.Object(
          {
            connect: t.Array(
              t.Object(
                {
                  id: t.Integer({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
            disconnect: t.Array(
              t.Object(
                {
                  id: t.Integer({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
          },
          { additionalProperties: false },
        ),
      ),
      workspace: t.Object(
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

export const RoomWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.Integer(),
          workspaceId: t.Integer(),
          name: t.String(),
          slug: t.String(),
          description: t.String(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "Room" },
  ),
);

export const RoomWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(
          t.Object(
            {
              id: t.Integer(),
              workspaceId_slug: t.Object(
                { workspaceId: t.Integer(), slug: t.String() },
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
              workspaceId_slug: t.Object(
                { workspaceId: t.Integer(), slug: t.String() },
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
              workspaceId: t.Integer(),
              name: t.String(),
              slug: t.String(),
              description: t.String(),
              createdAt: t.Date(),
              updatedAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "Room" },
);

export const RoomSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      workspaceId: t.Boolean(),
      name: t.Boolean(),
      slug: t.Boolean(),
      description: t.Boolean(),
      createdAt: t.Boolean(),
      updatedAt: t.Boolean(),
      messages: t.Boolean(),
      workspace: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const RoomInclude = t.Partial(
  t.Object(
    { messages: t.Boolean(), workspace: t.Boolean(), _count: t.Boolean() },
    { additionalProperties: false },
  ),
);

export const RoomOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      workspaceId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      name: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      slug: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      description: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      createdAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      updatedAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const Room = t.Composite([RoomPlain, RoomRelations], {
  additionalProperties: false,
});

export const RoomInputCreate = t.Composite(
  [RoomPlainInputCreate, RoomRelationsInputCreate],
  { additionalProperties: false },
);

export const RoomInputUpdate = t.Composite(
  [RoomPlainInputUpdate, RoomRelationsInputUpdate],
  { additionalProperties: false },
);
