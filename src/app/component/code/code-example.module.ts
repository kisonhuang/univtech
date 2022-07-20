import {NgModule, Type} from '@angular/core';
import {CommonModule} from '@angular/common';

import {ElementComponentModule} from '../element/element-registry.service';
import {CodeExampleComponent} from './code-example.component';
import {CodeModule} from './code.module';

/**
 * 代码示例模块
 */
@NgModule({
    declarations: [CodeExampleComponent],
    imports: [CommonModule, CodeModule],
    exports: [CodeExampleComponent],
})
export class CodeExampleModule implements ElementComponentModule {

    elementComponent: Type<any> = CodeExampleComponent;

}
