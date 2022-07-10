import {InjectionToken, StaticProvider} from '@angular/core';

import {WindowToken} from './window.service';

/**
 * 本地存储
 */
export const LocalStorage = new InjectionToken<Storage>('LocalStorage');

/**
 * 会话存储
 */
export const SessionStorage = new InjectionToken<Storage>('SessionStorage');

/**
 * 存储提供器：本地存储提供器、会话存储存储提供器。
 */
export const StorageProviders: StaticProvider[] = [
    {
        provide: LocalStorage,
        useFactory: (window: Window) => getStorage(window, 'localStorage'),
        deps: [WindowToken]
    },
    {
        provide: SessionStorage,
        useFactory: (window: Window) => getStorage(window, 'sessionStorage'),
        deps: [WindowToken]
    },
];

/**
 * Storage：用于访问特定领域的会话或本地存储。<br>
 * NoopStorage：什么都不做的存储对象。
 */
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

/**
 * 获取存储对象，浏览器禁用Cookie时，访问window[storageType]会抛出错误，这时返回NoopStorage。
 *
 * @param window Window对象
 * @param storageType 存储类型：本地存储localStorage、会话存储sessionStorage
 */
function getStorage(window: Window, storageType: 'localStorage' | 'sessionStorage'): Storage {
    try {
        return window[storageType];
    } catch {
        return new NoopStorage();
    }
}
