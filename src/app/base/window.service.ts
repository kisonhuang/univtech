import {InjectionToken} from '@angular/core';

/**
 * Window令牌，应用于依赖注入提供器
 */
export const WindowToken = new InjectionToken<Window>('Window');

/**
 * Window提供器
 */
export function windowProvider() {
    return window;
}
