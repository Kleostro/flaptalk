import { t, type Static } from 'elysia';

const WORKSPACE_NAME_MAX_LENGTH = 120;
const WORKSPACE_NAME_MIN_LENGTH = 1;
const WORKSPACE_DESCRIPTION_MAX_LENGTH = 500;

export const WorkspaceMemberRoleModel = t.Union([t.Literal('owner'), t.Literal('member')]);

export type WorkspaceMemberRole = Static<typeof WorkspaceMemberRoleModel>;

export const WorkspaceModel = t.Object({
  createdAt: t.String({
    format: 'date-time',
  }),
  description: t.Nullable(t.String()),
  id: t.Numeric(),
  name: t.String(),
  ownerId: t.Numeric(),
  slug: t.String(),
  updatedAt: t.String({
    format: 'date-time',
  }),
});

export type Workspace = Static<typeof WorkspaceModel>;

export const WorkspaceAccessModel = t.Object({
  role: WorkspaceMemberRoleModel,
  workspace: WorkspaceModel,
});

export type WorkspaceAccess = Static<typeof WorkspaceAccessModel>;

export const CreateWorkspaceRequestBodyModel = t.Object({
  description: t.Optional(
    t.String({
      maxLength: WORKSPACE_DESCRIPTION_MAX_LENGTH,
    }),
  ),
  name: t.String({
    maxLength: WORKSPACE_NAME_MAX_LENGTH,
    minLength: WORKSPACE_NAME_MIN_LENGTH,
  }),
});

export type CreateWorkspaceRequestBody = Static<typeof CreateWorkspaceRequestBodyModel>;

export const WorkspacesModel = {
  'workspaces.create.body': CreateWorkspaceRequestBodyModel,
  'workspaces.create.response': WorkspaceAccessModel,
  'workspaces.entity': WorkspaceModel,
  'workspaces.list.response': t.Object({
    workspaces: t.Array(WorkspaceAccessModel),
  }),
  'workspaces.role': WorkspaceMemberRoleModel,
  'workspaces.single.response': WorkspaceAccessModel,
};
