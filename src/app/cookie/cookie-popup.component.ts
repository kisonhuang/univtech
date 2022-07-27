import {Component, Inject} from '@angular/core';

import {localStorageToken} from '../base/storage.service';

export const StorageKeyAcceptCookie = 'sk-accept-cookie';

@Component({
    selector: 'univ-cookie-popup',
    templateUrl: './cookie-popup.component.html',
})
export class CookiePopupComponent {

    hasAcceptedCookie: boolean;

    constructor(@Inject(localStorageToken) private storage: Storage) {
        this.hasAcceptedCookie = this.storage.getItem(StorageKeyAcceptCookie) === 'true';
    }

    acceptCookie() {
        this.storage.setItem(StorageKeyAcceptCookie, 'true');
        this.hasAcceptedCookie = true;
    }

}
