import {InjectionToken, StaticProvider} from '@angular/core';

import {windowToken} from './window.service';

// 本地存储对象令牌
export const localStorageToken = new InjectionToken<Storage>('localStorage');

// 会话存储对象令牌
export const sessionStorageToken = new InjectionToken<Storage>('sessionStorage');

// 存储对象提供器：本地存储对象提供器、会话存储对象提供器
export const storageProviders: StaticProvider[] = [
    {provide: localStorageToken, useFactory: (window: Window) => getStorage(window, 'localStorage'), deps: [windowToken]},
    {provide: sessionStorageToken, useFactory: (window: Window) => getStorage(window, 'sessionStorage'), deps: [windowToken]},
];

// Storage：特定领域的会话或本地存储的访问接口；NoopStorage：什么都不做的存储对象
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

/**
 * 获取存储对象，浏览器禁用Cookie时，访问window[storageType]会抛出错误，这时返回NoopStorage
 *
 * @param window Window对象
 * @param storageType 存储类型，本地存储：localStorage、会话存储：sessionStorage
 * @return Storage 存储对象
 */
function getStorage(window: Window, storageType: 'localStorage' | 'sessionStorage'): Storage {
    try {
        return window[storageType];
    } catch {
        return new NoopStorage();
    }
}
