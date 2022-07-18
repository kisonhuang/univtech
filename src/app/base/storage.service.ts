import {InjectionToken, StaticProvider} from '@angular/core';

import {WindowToken} from './window.service';

export const LocalStorageToken = new InjectionToken<Storage>('LocalStorage');

export const SessionStorageToken = new InjectionToken<Storage>('SessionStorage');

export const storageProviders: StaticProvider[] = [
    {
        provide: LocalStorageToken,
        useFactory: (window: Window) => getStorage(window, 'localStorage'),
        deps: [WindowToken]
    },
    {
        provide: SessionStorageToken,
        useFactory: (window: Window) => getStorage(window, 'sessionStorage'),
        deps: [WindowToken]
    },
];

export class NoopStorage implements Storage {

    length = 0;

    key(index: number) {
        return null;
    }

    getItem(key: string) {
        return null;
    }

    setItem(key: string, value: string) {

    }

    removeItem(key: string) {

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
