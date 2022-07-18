import {InjectionToken} from '@angular/core';

/**
 * 当前日期令牌，用于依赖注入提供器
 */
export const CurrentDateToken = new InjectionToken('CurrentDate');

/**
 * 当前日期提供器
 */
export function currentDateProvider() {
    return new Date();
}
