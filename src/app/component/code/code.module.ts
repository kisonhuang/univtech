import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatSnackBarModule} from '@angular/material/snack-bar';

import {CodeComponent} from './code.component';
import {CodePrettyService} from './code-pretty.service';

@NgModule({
    declarations: [CodeComponent],
    imports: [CommonModule, MatSnackBarModule],
    exports: [CodeComponent],
    providers: [CodePrettyService]
})
export class CodeModule {

}
