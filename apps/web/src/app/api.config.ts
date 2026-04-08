import { treaty } from '@elysiajs/eden';

import type { AppContract } from '@api/contracts/app.contract';
import { environment } from '@web/environments/environment';

export const resolveApiUrl = (): string => environment.apiBaseUrl;

export const api = treaty<AppContract>(resolveApiUrl(), {
  fetcher: (input, init) =>
    fetch(input, {
      ...init,
      credentials: 'include',
    }),
});
