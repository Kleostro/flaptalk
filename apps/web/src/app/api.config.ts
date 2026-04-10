import { treaty } from '@elysiajs/eden';

import type { AppContract } from '@flaptalk/api-contract';
import { environment } from '@web/environments/environment';

export const resolveApiUrl = (): string => {
  if (/^https?:\/\//.test(environment.apiBaseUrl)) {
    return environment.apiBaseUrl;
  }

  return new URL(environment.apiBaseUrl, globalThis.location.origin).toString();
};

export const api = treaty<AppContract>(resolveApiUrl(), {
  fetcher: (input, init) =>
    fetch(input, {
      ...init,
      credentials: 'include',
    }),
});
