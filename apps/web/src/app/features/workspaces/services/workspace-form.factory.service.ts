import { Injectable, signal, type WritableSignal } from '@angular/core';
import { type FieldTree, form, maxLength, minLength, required } from '@angular/forms/signals';

import { type CreateMessage } from '@web/app/features/workspaces/types/create-message.model';
import { type CreateRoom } from '@web/app/features/workspaces/types/create-room.model';
import { type CreateWorkspace } from '@web/app/features/workspaces/types/create-workspace.model';

const MESSAGE_BODY_MAX_LENGTH = 4000;
const MESSAGE_BODY_MIN_LENGTH = 1;
const ROOM_DESCRIPTION_MAX_LENGTH = 500;
const ROOM_NAME_MAX_LENGTH = 120;
const ROOM_NAME_MIN_LENGTH = 1;
const WORKSPACE_DESCRIPTION_MAX_LENGTH = 500;
const WORKSPACE_NAME_MAX_LENGTH = 120;
const WORKSPACE_NAME_MIN_LENGTH = 1;

@Injectable({ providedIn: 'root' })
export class WorkspaceFormFactoryService {
  public createMessageForm(model: WritableSignal<CreateMessage>): FieldTree<CreateMessage> {
    return form(model, (path) => {
      required(path.body, { message: 'Message body is required.' });
      minLength(path.body, MESSAGE_BODY_MIN_LENGTH, {
        message: 'Message body cannot be empty.',
      });
      maxLength(path.body, MESSAGE_BODY_MAX_LENGTH, {
        message: `Use no more than ${MESSAGE_BODY_MAX_LENGTH} characters.`,
      });
    });
  }

  public createMessageModel(): WritableSignal<CreateMessage> {
    return signal({
      body: '',
    });
  }

  public createRoomForm(model: WritableSignal<CreateRoom>): FieldTree<CreateRoom> {
    return form(model, (path) => {
      required(path.name, { message: 'Room name is required.' });
      minLength(path.name, ROOM_NAME_MIN_LENGTH, {
        message: 'Room name cannot be empty.',
      });
      maxLength(path.name, ROOM_NAME_MAX_LENGTH, {
        message: `Use no more than ${ROOM_NAME_MAX_LENGTH} characters.`,
      });

      maxLength(path.description, ROOM_DESCRIPTION_MAX_LENGTH, {
        message: `Use no more than ${ROOM_DESCRIPTION_MAX_LENGTH} characters.`,
      });
    });
  }

  public createRoomModel(): WritableSignal<CreateRoom> {
    return signal({
      description: '',
      name: '',
    });
  }

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
