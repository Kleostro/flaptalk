import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const InvitePlain = t.Object(
  {
    id: t.Integer(),
    workspaceId: t.Integer(),
    createdById: t.Integer(),
    token: t.String(),
    email: __nullable__(t.String()),
    expiresAt: t.Date(),
    usedAt: __nullable__(t.Date()),
    createdAt: t.Date(),
  },
  { additionalProperties: false },
);

export const InviteRelations = t.Object(
  {
    createdBy: t.Object(
      {
        id: t.Integer(),
        email: t.String(),
        hashedPassword: t.String(),
        createdAt: t.Date(),
        updatedAt: t.Date(),
      },
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

export const InvitePlainInputCreate = t.Object(
  {
    token: t.String(),
    email: t.Optional(__nullable__(t.String())),
    expiresAt: t.Date(),
    usedAt: t.Optional(__nullable__(t.Date())),
  },
  { additionalProperties: false },
);

export const InvitePlainInputUpdate = t.Object(
  {
    token: t.Optional(t.String()),
    email: t.Optional(__nullable__(t.String())),
    expiresAt: t.Optional(t.Date()),
    usedAt: t.Optional(__nullable__(t.Date())),
  },
  { additionalProperties: false },
);

export const InviteRelationsInputCreate = t.Object(
  {
    createdBy: t.Object(
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

export const InviteRelationsInputUpdate = t.Partial(
  t.Object(
    {
      createdBy: t.Object(
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

export const InviteWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.Integer(),
          workspaceId: t.Integer(),
          createdById: t.Integer(),
          token: t.String(),
          email: t.String(),
          expiresAt: t.Date(),
          usedAt: t.Date(),
          createdAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "Invite" },
  ),
);

export const InviteWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(
          t.Object(
            { id: t.Integer(), token: t.String() },
            { additionalProperties: false },
          ),
          { additionalProperties: false },
        ),
        t.Union(
          [t.Object({ id: t.Integer() }), t.Object({ token: t.String() })],
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
              createdById: t.Integer(),
              token: t.String(),
              email: t.String(),
              expiresAt: t.Date(),
              usedAt: t.Date(),
              createdAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "Invite" },
);

export const InviteSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      workspaceId: t.Boolean(),
      createdById: t.Boolean(),
      token: t.Boolean(),
      email: t.Boolean(),
      expiresAt: t.Boolean(),
      usedAt: t.Boolean(),
      createdAt: t.Boolean(),
      createdBy: t.Boolean(),
      workspace: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const InviteInclude = t.Partial(
  t.Object(
    { createdBy: t.Boolean(), workspace: t.Boolean(), _count: t.Boolean() },
    { additionalProperties: false },
  ),
);

export const InviteOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      workspaceId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      createdById: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      token: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      email: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      expiresAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      usedAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      createdAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const Invite = t.Composite([InvitePlain, InviteRelations], {
  additionalProperties: false,
});

export const InviteInputCreate = t.Composite(
  [InvitePlainInputCreate, InviteRelationsInputCreate],
  { additionalProperties: false },
);

export const InviteInputUpdate = t.Composite(
  [InvitePlainInputUpdate, InviteRelationsInputUpdate],
  { additionalProperties: false },
);
