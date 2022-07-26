import {NgModule, Type} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';

import {ElementComponentModule} from '../element/element-registry.service';
import {TocComponent} from './toc.component';

@NgModule({
    imports: [CommonModule, MatIconModule],
    declarations: [TocComponent],
})
export class TocModule implements ElementComponentModule {

    elementComponent: Type<any> = TocComponent;

}
