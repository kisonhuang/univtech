import {NgModule, Type} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FileNotFoundSearchComponent} from './file-not-found-search.component';
import {ElementComponentModule} from '../element/element-registry.service';

@NgModule({
    imports: [CommonModule],
    declarations: [FileNotFoundSearchComponent]
})
export class FileNotFoundSearchModule implements ElementComponentModule {
    elementComponent: Type<any> = FileNotFoundSearchComponent;
}
