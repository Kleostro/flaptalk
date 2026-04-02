import { t } from "elysia";

import {
  UserInputCreate,
  UserInputUpdate,
  UserPlain,
} from "../../generated/prismabox/User";

export const UsersPrismaModel = {
  "users.entity": UserPlain,
  "users.create.body": UserInputCreate,
  "users.update.body": UserInputUpdate,
  "users.list.response": t.Array(UserPlain),
  "users.create.response": t.Ref("users.entity"),
  "users.update.response": t.Ref("users.entity"),
  "users.archive.response": t.Ref("users.entity"),
};
