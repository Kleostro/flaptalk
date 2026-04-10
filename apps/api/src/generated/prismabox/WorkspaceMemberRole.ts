import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const WorkspaceMemberRole = t.Union(
  [t.Literal("OWNER"), t.Literal("MEMBER")],
  { additionalProperties: false },
);
