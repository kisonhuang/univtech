import {InjectionToken, StaticProvider} from '@angular/core';

import {windowToken} from './window.service';

export const localStorageToken = new InjectionToken<Storage>('localStorage');

export const sessionStorageToken = new InjectionToken<Storage>('sessionStorage');

export const storageProviders: StaticProvider[] = [
    {provide: localStorageToken, useFactory: (window: Window) => getStorage(window, 'localStorage'), deps: [windowToken]},
    {provide: sessionStorageToken, useFactory: (window: Window) => getStorage(window, 'sessionStorage'), deps: [windowToken]},
];

export class NoopStorage implements Storage {

    length = 0;

    key() {
        return null;
    }

    getItem() {
        return null;
    }

    setItem() {

    }

    removeItem() {

    }

    clear() {

    }

}

function getStorage(window: Window, storageType: 'localStorage' | 'sessionStorage'): Storage {
    try {
        return window[storageType];
    } catch {
        return new NoopStorage();
    }
}
