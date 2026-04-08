import { t } from 'elysia';

export const ErrorResponseModel = t.Object({
  code: t.String(),
  message: t.String(),
});

export const ErrorModel = {
  'error.response': ErrorResponseModel,
};
