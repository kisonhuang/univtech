import {NgModule, Type} from '@angular/core';
import {CommonModule} from '@angular/common';

import {ElementComponentModule} from '../element/element-registry.service';
import {SearchResultModule} from './search-result.module';
import {SearchNoResultComponent} from './search-no-result.component';

@NgModule({
    declarations: [SearchNoResultComponent],
    imports: [CommonModule, SearchResultModule],
})
export class SearchNoResultModule implements ElementComponentModule {

    elementComponent: Type<any> = SearchNoResultComponent;

}
