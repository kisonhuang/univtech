import {InjectionToken} from '@angular/core';

// 当前日期令牌
export const currentDateToken = new InjectionToken('currentDateToken');

// 当前日期提供器
export function currentDateProvider() {
    return new Date();
}
