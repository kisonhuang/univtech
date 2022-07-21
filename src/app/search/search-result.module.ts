import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';

import {SearchResultComponent} from './search-result.component';

@NgModule({
    declarations: [
        SearchResultComponent,
    ],
    imports: [
        CommonModule,
        MatIconModule,
    ],
    exports: [
        SearchResultComponent,
        MatIconModule,
    ],
})
export class SearchResultModule {

}
