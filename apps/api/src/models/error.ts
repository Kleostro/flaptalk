import { t } from "elysia";

export const ErrorResponse = t.Object({
  code: t.String(),
  message: t.String(),
});

export const ErrorModel = {
  "error.response": ErrorResponse,
};
