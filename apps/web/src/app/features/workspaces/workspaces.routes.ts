import { Routes } from '@angular/router';

import { WorkspaceHomePageComponent } from '@web/app/features/workspaces/pages/workspace-home-page.component';
import { WorkspaceRoomPageComponent } from '@web/app/features/workspaces/pages/workspace-room-page.component';
import { WorkspaceShellPageComponent } from '@web/app/features/workspaces/pages/workspace-shell-page.component';

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
    ],
    component: WorkspaceShellPageComponent,
    path: '',
  },
];
