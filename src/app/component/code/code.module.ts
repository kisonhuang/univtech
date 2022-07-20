import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatSnackBarModule} from '@angular/material/snack-bar';

import {CodeComponent} from './code.component';
import {CodePrettyService} from './code-pretty.service';

/**
 * 代码模块
 */
@NgModule({
    providers: [CodePrettyService],
    declarations: [CodeComponent],
    imports: [CommonModule, MatSnackBarModule],
    exports: [CodeComponent],
})
export class CodeModule {

}
