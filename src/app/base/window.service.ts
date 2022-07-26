import {InjectionToken} from '@angular/core';

// Window对象令牌
export const windowToken: InjectionToken<Window> = new InjectionToken<Window>('windowToken');

// Window对象提供器
export function windowProvider(): Window {
    return window;
}
