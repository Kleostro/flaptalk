import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const WorkspaceMemberPlain = t.Object(
  {
    id: t.Integer(),
    workspaceId: t.Integer(),
    userId: t.Integer(),
    role: t.Union([t.Literal("OWNER"), t.Literal("MEMBER")], {
      additionalProperties: false,
    }),
    joinedAt: t.Date(),
  },
  { additionalProperties: false },
);

export const WorkspaceMemberRelations = t.Object(
  {
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

export const WorkspaceMemberPlainInputCreate = t.Object(
  {
    role: t.Optional(
      t.Union([t.Literal("OWNER"), t.Literal("MEMBER")], {
        additionalProperties: false,
      }),
    ),
    joinedAt: t.Optional(t.Date()),
  },
  { additionalProperties: false },
);

export const WorkspaceMemberPlainInputUpdate = t.Object(
  {
    role: t.Optional(
      t.Union([t.Literal("OWNER"), t.Literal("MEMBER")], {
        additionalProperties: false,
      }),
    ),
    joinedAt: t.Optional(t.Date()),
  },
  { additionalProperties: false },
);

export const WorkspaceMemberRelationsInputCreate = t.Object(
  {
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

export const WorkspaceMemberRelationsInputUpdate = t.Partial(
  t.Object(
    {
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

export const WorkspaceMemberWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.Integer(),
          workspaceId: t.Integer(),
          userId: t.Integer(),
          role: t.Union([t.Literal("OWNER"), t.Literal("MEMBER")], {
            additionalProperties: false,
          }),
          joinedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "WorkspaceMember" },
  ),
);

export const WorkspaceMemberWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(
          t.Object(
            {
              id: t.Integer(),
              workspaceId_userId: t.Object(
                { workspaceId: t.Integer(), userId: t.Integer() },
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
              workspaceId_userId: t.Object(
                { workspaceId: t.Integer(), userId: t.Integer() },
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
              userId: t.Integer(),
              role: t.Union([t.Literal("OWNER"), t.Literal("MEMBER")], {
                additionalProperties: false,
              }),
              joinedAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "WorkspaceMember" },
);

export const WorkspaceMemberSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      workspaceId: t.Boolean(),
      userId: t.Boolean(),
      role: t.Boolean(),
      joinedAt: t.Boolean(),
      workspace: t.Boolean(),
      user: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const WorkspaceMemberInclude = t.Partial(
  t.Object(
    {
      role: t.Boolean(),
      workspace: t.Boolean(),
      user: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const WorkspaceMemberOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      workspaceId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      userId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      joinedAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const WorkspaceMember = t.Composite(
  [WorkspaceMemberPlain, WorkspaceMemberRelations],
  { additionalProperties: false },
);

export const WorkspaceMemberInputCreate = t.Composite(
  [WorkspaceMemberPlainInputCreate, WorkspaceMemberRelationsInputCreate],
  { additionalProperties: false },
);

export const WorkspaceMemberInputUpdate = t.Composite(
  [WorkspaceMemberPlainInputUpdate, WorkspaceMemberRelationsInputUpdate],
  { additionalProperties: false },
);
