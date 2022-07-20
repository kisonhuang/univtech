import {NgModule, Type} from '@angular/core';
import {CommonModule} from '@angular/common';

import {WithCustomElementComponent} from '../element/element-registry.service';
import {CodeExampleComponent} from './code-example.component';
import {CodeModule} from './code.module';

@NgModule({
    declarations: [CodeExampleComponent],
    imports: [CommonModule, CodeModule],
    exports: [CodeExampleComponent]
})
export class CodeExampleModule implements WithCustomElementComponent {

    customElementComponent: Type<any> = CodeExampleComponent;

}
