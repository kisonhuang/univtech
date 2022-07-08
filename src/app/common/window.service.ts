import {InjectionToken} from '@angular/core';

/**
 * Window令牌
 */
export const WindowToken = new InjectionToken<Window>('Window');

/**
 * Window提供器
 */
export function windowService() {
    return window;
}
