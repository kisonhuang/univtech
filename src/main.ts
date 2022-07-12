import {enableProdMode} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {AppModule} from './app/app.module';
import {environment} from './environments/environment';

// 在生产环境中启用生产模式
if (environment.production) {
    enableProdMode();
}

// 在平台上启动应用模块（AppModule）
platformBrowserDynamic().bootstrapModule(AppModule);
