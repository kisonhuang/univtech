import {InjectionToken} from '@angular/core';

// Window对象令牌
export const windowToken = new InjectionToken<Window>('window');

// Window对象提供器
export function windowProvider() {
    return window;
}
