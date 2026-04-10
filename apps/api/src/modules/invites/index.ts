import { Elysia } from 'elysia';

import { authPlugin, type AuthJwtVerifier } from '@api/modules/auth/plugin';
import { invitesService, type InvitesServiceType } from '@api/modules/invites/service';
import {
  requireAuthenticatedUserId,
  workspaceSessionCookieModel,
} from '@api/modules/workspaces/route-helpers';
import { ErrorModel, InviteTokenParamsModel, InvitesModel } from '@flaptalk/api-contract';

export const invitesModule = new Elysia({
  name: 'flaptalk.invites.routes',
  prefix: '/invites',
})
  .use(authPlugin)
  .use(invitesService)
  .model(ErrorModel)
  .model(InvitesModel)
  .get(
    '/:token',
    async ({
      invitesService,
      params,
    }: {
      readonly invitesService: InvitesServiceType;
      readonly params: {
        readonly token: string;
      };
    }) => invitesService.getInvitePreview(params.token),
    {
      params: InviteTokenParamsModel,
      response: {
        200: 'invites.preview.response',
        404: 'error.response',
      },
    },
  )
  .post(
    '/:token/accept',
    async ({
      authJwt,
      cookie,
      invitesService,
      params,
    }: {
      readonly authJwt: AuthJwtVerifier;
      readonly cookie: Record<string, { value?: string | undefined }>;
      readonly invitesService: InvitesServiceType;
      readonly params: {
        readonly token: string;
      };
    }) => {
      const userId = await requireAuthenticatedUserId({ authJwt, cookie });

      return invitesService.acceptInvite({
        token: params.token,
        userId,
      });
    },
    {
      cookie: workspaceSessionCookieModel,
      params: InviteTokenParamsModel,
      response: {
        200: 'invites.accept.response',
        401: 'error.response',
        403: 'error.response',
        404: 'error.response',
        409: 'error.response',
      },
    },
  );
