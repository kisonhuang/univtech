import {NgModule, Type} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatCardModule} from '@angular/material/card';
import {MatTabsModule} from '@angular/material/tabs';

import {WithCustomElementComponent} from '../element/element-registry.service';
import {CodeModule} from './code.module';
import {CodeTabComponent} from './code-tab.component';

@NgModule({
    declarations: [CodeTabComponent],
    imports: [CommonModule, MatCardModule, MatTabsModule, CodeModule],
    exports: [CodeTabComponent]
})
export class CodeTabsModule implements WithCustomElementComponent {

    customElementComponent: Type<any> = CodeTabComponent;

}
