import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

declare var require: any;

if (environment.production) {
  enableProdMode();
}

const uuid = require('uuid/v4');
if (!localStorage.getItem('device_uuid')) {
  localStorage.setItem('device_uuid', uuid());
}

platformBrowserDynamic().bootstrapModule(AppModule);
