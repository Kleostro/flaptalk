import { t, type Static } from 'elysia';

import { PublicUserModel } from './users';
import { WorkspaceMemberRoleModel, WorkspaceModel } from './workspaces';

const INVITE_EMAIL_MAX_LENGTH = 320;
const INVITE_TTL_HOURS_DEFAULT = 72;
const INVITE_TTL_HOURS_MAX = 24 * 30;
const INVITE_TTL_HOURS_MIN = 1;

export const WorkspaceMemberModel = t.Object({
  id: t.Numeric(),
  joinedAt: t.String({
    format: 'date-time',
  }),
  role: WorkspaceMemberRoleModel,
  user: PublicUserModel,
});

export type WorkspaceMember = Static<typeof WorkspaceMemberModel>;

export const InviteModel = t.Object({
  createdAt: t.String({
    format: 'date-time',
  }),
  createdById: t.Numeric(),
  email: t.Nullable(
    t.String({
      format: 'email',
    }),
  ),
  expiresAt: t.String({
    format: 'date-time',
  }),
  id: t.Numeric(),
  token: t.String(),
  usedAt: t.Nullable(
    t.String({
      format: 'date-time',
    }),
  ),
  workspaceId: t.Numeric(),
});

export type Invite = Static<typeof InviteModel>;

export const InvitePreviewModel = t.Object({
  expiresAt: t.String({
    format: 'date-time',
  }),
  invite: InviteModel,
  isExpired: t.Boolean(),
  isUsed: t.Boolean(),
  workspace: WorkspaceModel,
});

export type InvitePreview = Static<typeof InvitePreviewModel>;

export const CreateInviteRequestBodyModel = t.Object({
  email: t.Optional(
    t.String({
      format: 'email',
      maxLength: INVITE_EMAIL_MAX_LENGTH,
    }),
  ),
  expiresInHours: t.Optional(
    t.Numeric({
      default: INVITE_TTL_HOURS_DEFAULT,
      maximum: INVITE_TTL_HOURS_MAX,
      minimum: INVITE_TTL_HOURS_MIN,
    }),
  ),
});

export type CreateInviteRequestBody = Static<typeof CreateInviteRequestBodyModel>;

export const InviteTokenParamsModel = t.Object({
  token: t.String({
    minLength: 1,
  }),
});

export type InviteTokenParams = Static<typeof InviteTokenParamsModel>;

const ActionSuccessResponseModel = t.Object({
  success: t.Literal(true),
});

export const InvitesModel = {
  'invites.accept.response': t.Object({
    role: WorkspaceMemberRoleModel,
    workspace: WorkspaceModel,
  }),
  'invites.create.body': CreateInviteRequestBodyModel,
  'invites.create.response': InviteModel,
  'invites.entity': InviteModel,
  'invites.list.response': t.Object({
    invites: t.Array(InviteModel),
  }),
  'invites.preview.response': InvitePreviewModel,
  'invites.revoke.response': ActionSuccessResponseModel,
  'workspaces.member.entity': WorkspaceMemberModel,
  'workspaces.members.list.response': t.Object({
    members: t.Array(WorkspaceMemberModel),
  }),
  'workspaces.members.remove.response': ActionSuccessResponseModel,
};
