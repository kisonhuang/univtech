import {NgModule, Type} from '@angular/core';
import {CommonModule} from '@angular/common';

import {ElementModule} from '../element/element-registry.service';
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
export class CodeExampleModule implements ElementModule {

    elementComponent: Type<any> = CodeExampleComponent;

}
