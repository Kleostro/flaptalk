import { treaty } from '@elysiajs/eden';

import type { App } from '@api/app';
import { environment } from '@web/environments/environment';

export const resolveApiUrl = (): string => environment.apiBaseUrl;

export const api = treaty<App>(resolveApiUrl(), {
  fetcher: (input, init) =>
    fetch(input, {
      ...init,
      credentials: 'include',
    }),
});
