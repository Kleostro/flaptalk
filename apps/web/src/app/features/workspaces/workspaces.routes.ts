import { Routes } from '@angular/router';

import { WorkspaceHomePageComponent } from '@web/app/features/workspaces/pages/workspace-home-page.component';
import { WorkspaceRoomCreatePageComponent } from '@web/app/features/workspaces/pages/workspace-room-create-page.component';
import { WorkspaceRoomPageComponent } from '@web/app/features/workspaces/pages/workspace-room-page.component';
import { WorkspaceShellPageComponent } from '@web/app/features/workspaces/pages/workspace-shell-page.component';
import { WorkspaceSetupPageComponent } from '@web/app/features/workspaces/pages/workspace-setup-page.component';
import { APP_ROUTE_PATHS } from '@web/app/core/constants/app-routes.constants';

export const WORKSPACE_ROUTES: Routes = [
  {
    children: [
      {
        component: WorkspaceHomePageComponent,
        path: '',
        pathMatch: 'full',
      },
      {
        component: WorkspaceRoomPageComponent,
        path: 'rooms/:roomId',
      },
      {
        component: WorkspaceSetupPageComponent,
        path: APP_ROUTE_PATHS.workspaceSetup,
      },
      {
        component: WorkspaceRoomCreatePageComponent,
        path:
          `${APP_ROUTE_PATHS.workspaceSetup}/${APP_ROUTE_PATHS.workspaceSetupRooms}/` +
          APP_ROUTE_PATHS.workspaceSetupRoomsNew,
      },
    ],
    component: WorkspaceShellPageComponent,
    path: '',
  },
];
