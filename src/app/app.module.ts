import {NgModule} from '@angular/core';
import {LocationStrategy, PathLocationStrategy} from '@angular/common';
import {HttpClientModule} from '@angular/common/http';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ServiceWorkerModule} from '@angular/service-worker';

import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatProgressBarModule} from '@angular/material/progress-bar';

import {scriptUrl, unwrapScriptUrlForSink} from 'safevalues';

//=====================================================================================

import {AppComponent} from './app.component';
import {environment} from '../environments/environment';

import {svgIconProviders} from './base/icon.service';

import {ThemeComponent} from './theme/theme.component';
import {CookiePopupComponent} from './cookie/cookie-popup.component';

@NgModule({
    declarations: [
        AppComponent,
        ThemeComponent,
        CookiePopupComponent,
    ],
    imports: [
        HttpClientModule,
        BrowserModule,
        BrowserAnimationsModule.withConfig({disableAnimations: AppComponent.reducedMotion}),
        ServiceWorkerModule.register(unwrapScriptUrlForSink(scriptUrl`/ngsw-worker.js`), {enabled: environment.production}), // Make sure service worker is loaded with a TrustedScriptURL
        MatButtonModule,
        MatToolbarModule,
        MatSidenavModule,
        MatProgressBarModule,
        MatIconModule,
    ],
    providers: [
        // {provide: ErrorHandler, useClass: ErrorService},
        {provide: LocationStrategy, useClass: PathLocationStrategy},
        // {provide: MatIconRegistry, useClass: IconService},
        svgIconProviders,
    ],
    bootstrap: [AppComponent]
})
export class AppModule {

}
