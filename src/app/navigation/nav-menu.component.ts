import {Component, Input} from '@angular/core';
import {CurrentNode, NavigationNode} from './navigation.model';

@Component({
    selector: 'univ-nav-menu',
    templateUrl: './nav-menu.component.html'
})
export class NavMenuComponent {

    @Input() currentNode: CurrentNode | undefined;

    @Input() isWide = false;

    @Input() nodes?: NavigationNode[];

    @Input() navLabel?: string;

    get filteredNodes() {
        return this.nodes ? this.nodes.filter(n => !n.hidden) : [];
    }

}
