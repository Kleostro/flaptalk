import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from '@web/app/app.config';
import { App } from '@web/app/app';

bootstrapApplication(App, appConfig).catch((error: unknown) => {
  console.error(error);
});
