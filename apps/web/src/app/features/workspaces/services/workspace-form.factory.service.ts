import { Injectable, signal, type WritableSignal } from '@angular/core';
import { type FieldTree, form, maxLength, minLength, required } from '@angular/forms/signals';

import { type CreateWorkspace } from '@web/app/features/workspaces/types/create-workspace.model';

const WORKSPACE_DESCRIPTION_MAX_LENGTH = 500;
const WORKSPACE_NAME_MAX_LENGTH = 120;
const WORKSPACE_NAME_MIN_LENGTH = 1;

@Injectable({ providedIn: 'root' })
export class WorkspaceFormFactoryService {
  public createWorkspaceForm(model: WritableSignal<CreateWorkspace>): FieldTree<CreateWorkspace> {
    return form(model, (path) => {
      required(path.name, { message: 'Workspace name is required.' });
      minLength(path.name, WORKSPACE_NAME_MIN_LENGTH, {
        message: 'Workspace name cannot be empty.',
      });
      maxLength(path.name, WORKSPACE_NAME_MAX_LENGTH, {
        message: `Use no more than ${WORKSPACE_NAME_MAX_LENGTH} characters.`,
      });

      maxLength(path.description, WORKSPACE_DESCRIPTION_MAX_LENGTH, {
        message: `Use no more than ${WORKSPACE_DESCRIPTION_MAX_LENGTH} characters.`,
      });
    });
  }

  public createWorkspaceModel(): WritableSignal<CreateWorkspace> {
    return signal({
      description: '',
      name: '',
    });
  }
}
