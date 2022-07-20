import {Component, Input} from '@angular/core';
import {CurrentNode, NavigationNode} from './navigation.model';

@Component({
    selector: 'univ-top-menu',
    templateUrl: 'top-menu.component.html'
})
export class TopMenuComponent {

    @Input() nodes?: NavigationNode[];

    @Input() currentNode: CurrentNode | undefined;

    get currentUrl(): string | null {
        return this.currentNode ? this.currentNode.url : null;
    }

}
