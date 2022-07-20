import {NgModule} from '@angular/core';
import {ROUTES} from '@angular/router';

import {ElementComponentModuleRoutes, ElementComponentModuleToken, ElementComponentModuleMap} from './element-registry.service';
import {ElementLoadService} from './element-load.service';
import {ElementLazyComponent} from './element-lazy.component';

@NgModule({
    providers: [
        ElementLoadService,
        {provide: ROUTES, useValue: ElementComponentModuleRoutes, multi: true},
        {provide: ElementComponentModuleToken, useValue: ElementComponentModuleMap},
    ],
    declarations: [ElementLazyComponent],
    exports: [ElementLazyComponent],
})
export class ElementModule {

}
