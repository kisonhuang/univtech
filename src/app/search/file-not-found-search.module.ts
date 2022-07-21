import {NgModule, Type} from '@angular/core';
import {CommonModule} from '@angular/common';

import {ElementComponentModule} from '../element/element-registry.service';
import {SearchResultModule} from './search-result.module';
import {FileNotFoundSearchComponent} from './file-not-found-search.component';

@NgModule({
    declarations: [FileNotFoundSearchComponent],
    imports: [CommonModule, SearchResultModule],
})
export class FileNotFoundSearchModule implements ElementComponentModule {

    elementComponent: Type<any> = FileNotFoundSearchComponent;

}
